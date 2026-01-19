<template>
  <div class="grid">
    <div class="card" style="grid-column: span 12">
      <h2>农田设备分布（简化坐标投影）</h2>
      <div class="muted">以经纬度做线性缩放，仅用于局域网/无蜂窝覆盖场景的可视化模拟</div>
      <div style="height: 10px"></div>
      <ChartBox :option="opt" height="520px" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import ChartBox from "../ChartBox.vue"

const props = defineProps({
  devices: { type: Object, required: true },
  sensors: { type: Object, required: true },
  valves: { type: Object, required: true }
})

function bounds(points) {
  const lats = points.map((p) => p.lat)
  const lons = points.map((p) => p.lon)
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons)
  }
}

const opt = computed(() => {
  const sensorPoints = (props.devices.sensors ?? []).map((d) => {
    const last = props.sensors.get(d.id)
    return {
      name: d.id,
      lat: d.lat,
      lon: d.lon,
      value: [d.lon, d.lat, last?.humidityPct ?? null],
      label: { show: false }
    }
  })
  const valvePoints = (props.devices.valves ?? []).map((d) => {
    const last = props.valves.get(d.id)
    return {
      name: d.id,
      lat: d.lat,
      lon: d.lon,
      value: [d.lon, d.lat, last?.state === "OPEN" ? 1 : 0]
    }
  })

  const all = [...sensorPoints, ...valvePoints]
  const b = all.length ? bounds(all) : { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 }

  return {
    tooltip: {
      trigger: "item",
      formatter: (p) => {
        const name = p.name
        if (name.startsWith("S")) {
          const last = props.sensors.get(name)
          return `${name}<br/>温度：${last?.tempC ?? "-"}℃<br/>湿度：${last?.humidityPct ?? "-"}%<br/>电压：${last?.batteryV ?? "-"}V`
        }
        const last = props.valves.get(name)
        return `${name}<br/>状态：${last?.state ?? "-"}<br/>电压：${last?.batteryV ?? "-"}V`
      }
    },
    xAxis: { type: "value", min: b.minLon - 0.0005, max: b.maxLon + 0.0005, name: "经度" },
    yAxis: { type: "value", min: b.minLat - 0.0005, max: b.maxLat + 0.0005, name: "纬度" },
    series: [
      {
        name: "传感器",
        type: "scatter",
        symbolSize: 10,
        itemStyle: { color: "#0ea5e9" },
        data: sensorPoints.map((p) => ({ name: p.name, value: p.value }))
      },
      {
        name: "电磁阀",
        type: "scatter",
        symbolSize: 14,
        itemStyle: { color: (p) => (p.value?.[2] === 1 ? "#22c55e" : "#ef4444") },
        data: valvePoints.map((p) => ({ name: p.name, value: p.value }))
      }
    ]
  }
})
</script>

