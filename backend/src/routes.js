import express from "express"
import path from "node:path"
import { readJsonlRange, writeJsonAtomic } from "./storage.js"

export function createRoutes({ state, storagePaths, irrigation }) {
  const router = express.Router()

  router.get("/health", (req, res) => {
    res.json({
      ok: true,
      ts: Date.now(),
      mqttBroker: { host: state.strategy?.mqtt?.host, port: state.strategy?.mqtt?.port }
    })
  })

  router.get("/devices", (req, res) => {
    res.json(state.devices ?? { sensors: [], valves: [] })
  })

  router.get("/strategy", (req, res) => {
    res.json(state.strategy)
  })

  router.put("/strategy", (req, res) => {
    const body = req.body ?? {}
    state.strategy = {
      ...state.strategy,
      ...body,
      updatedAt: Date.now()
    }
    writeJsonAtomic(storagePaths.strategyFile, state.strategy)
    res.json(state.strategy)
  })

  router.post("/mode", (req, res) => {
    const mode = req.body?.mode
    if (mode !== "auto" && mode !== "manual") return res.status(400).json({ error: "mode must be auto|manual" })
    state.strategy = { ...state.strategy, mode, updatedAt: Date.now() }
    writeJsonAtomic(storagePaths.strategyFile, state.strategy)
    res.json(state.strategy)
  })

  router.get("/latest", (req, res) => {
    const sensors = Array.from(state.sensors.values())
    const valves = Array.from(state.valves.values())
    res.json({ ts: Date.now(), sensors, valves })
  })

  router.post("/valves/:valveId/open", (req, res) => {
    const valveId = req.params.valveId
    const durationSec = Number(req.body?.durationSec ?? 600)
    irrigation.openValve(valveId, Number.isFinite(durationSec) ? durationSec : 600)
    res.json({ ok: true })
  })

  router.post("/valves/:valveId/close", (req, res) => {
    const valveId = req.params.valveId
    irrigation.closeValve(valveId)
    res.json({ ok: true })
  })

  router.get("/history", (req, res) => {
    const deviceId = String(req.query.deviceId ?? "")
    const type = String(req.query.type ?? "sensor")
    const from = req.query.from ? Number(req.query.from) : null
    const to = req.query.to ? Number(req.query.to) : null
    const limit = req.query.limit ? Number(req.query.limit) : 2000
    if (!deviceId) return res.status(400).json({ error: "deviceId required" })

    const date = req.query.date ? String(req.query.date) : null
    const today = new Date()
    const yyyyMmDd = date ?? today.toISOString().slice(0, 10)

    const filePath =
      type === "valve"
        ? path.join(storagePaths.historyDir, `valves-${yyyyMmDd}.jsonl`)
        : path.join(storagePaths.historyDir, `sensors-${yyyyMmDd}.jsonl`)

    const rows = readJsonlRange(filePath, from, to, Number.isFinite(limit) ? limit : 2000).filter(
      (r) => r.deviceId === deviceId || r.valveId === deviceId
    )
    res.json({ deviceId, type, date: yyyyMmDd, count: rows.length, rows })
  })

  return router
}

