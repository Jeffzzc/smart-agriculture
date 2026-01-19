import crypto from "node:crypto"

function randomId() {
  return crypto.randomBytes(8).toString("hex")
}

export function createIrrigationController({ state, mqttClient, broadcast }) {
  function getZoneForSensor(sensorId) {
    return state.devices?.sensors?.find((d) => d.id === sensorId)?.zone ?? "Z1"
  }

  function getValveForZone(zone) {
    const match = state.devices?.valves?.find((v) => v.zone === zone)
    return match?.id ?? null
  }

  function publishValveCommand(valveId, action, durationSec) {
    const commandId = randomId()
    const payload = {
      commandId,
      valveId,
      action,
      durationSec: durationSec ?? null,
      requestedAt: Date.now()
    }
    state.pendingCommands.set(commandId, {
      commandId,
      valveId,
      action,
      requestedAt: payload.requestedAt
    })
    mqttClient.publish(`farm/valves/${valveId}/downlink`, JSON.stringify(payload), {
      qos: 1
    })
    broadcast({ kind: "valve_command", ts: Date.now(), data: payload })
    return payload
  }

  function openValve(valveId, durationSec) {
    const v = state.valves.get(valveId) ?? { id: valveId, state: "CLOSE" }
    state.valves.set(valveId, { ...v, id: valveId })
    publishValveCommand(valveId, "OPEN", durationSec)
    if (durationSec && durationSec > 0) {
      const key = `close:${valveId}`
      if (state.autoJobs.has(key)) clearTimeout(state.autoJobs.get(key))
      const t = setTimeout(() => {
        closeValve(valveId)
        state.autoJobs.delete(key)
      }, durationSec * 1000)
      state.autoJobs.set(key, t)
    }
  }

  function closeValve(valveId) {
    const v = state.valves.get(valveId) ?? { id: valveId, state: "CLOSE" }
    state.valves.set(valveId, { ...v, id: valveId })
    publishValveCommand(valveId, "CLOSE", null)
  }

  function onSensorUplink(sensorMsg) {
    const strategy = state.strategy
    if (!strategy || strategy.mode !== "auto") return
    const { humidityPct, deviceId } = sensorMsg
    const humidity = Number(humidityPct)
    if (!Number.isFinite(humidity)) return
    const zone = getZoneForSensor(deviceId)
    const valveId = getValveForZone(zone)
    if (!valveId) return
    const valve = state.valves.get(valveId)
    const valveState = valve?.state ?? "CLOSE"
    const now = Date.now()
    const lastAutoAt = valve?.lastAutoAt ?? 0
    const cooldownMs = (strategy.cooldownMinutes ?? 20) * 60_000
    if (now - lastAutoAt < cooldownMs) return

    if (humidity <= strategy.humidityLowPct && valveState !== "OPEN") {
      state.valves.set(valveId, { ...(valve ?? { id: valveId }), lastAutoAt: now })
      openValve(valveId, strategy.openDurationSec ?? 600)
    }

    if (humidity >= strategy.humidityHighPct && valveState === "OPEN") {
      closeValve(valveId)
    }
  }

  return {
    onSensorUplink,
    openValve,
    closeValve,
    publishValveCommand
  }
}

