<template>
  <div class="grid">
    <div class="card" style="grid-column: span 6">
      <h2>模式切换</h2>
      <div class="row" v-if="strategy">
        <span>当前：{{ strategy.mode }}</span>
        <button class="secondary" @click="$emit('set-mode', 'manual')">手动</button>
        <button @click="$emit('set-mode', 'auto')">自动</button>
      </div>
      <div v-else class="muted">加载中...</div>
    </div>

    <div class="card" style="grid-column: span 6">
      <h2>阈值策略配置</h2>
      <div class="row" v-if="strategy">
        <span>湿度下限</span>
        <input type="number" v-model.number="draft.low" style="width: 90px" />
        <span>湿度上限</span>
        <input type="number" v-model.number="draft.high" style="width: 90px" />
        <span>开阀时长(s)</span>
        <input type="number" v-model.number="draft.duration" style="width: 110px" />
        <button @click="save">保存</button>
      </div>
    </div>

    <div class="card" style="grid-column: span 12">
      <h2>电磁阀控制</h2>
      <div class="row">
        <span class="muted">手动模式下可直接控制；自动模式由阈值触发，但仍可手动干预。</span>
      </div>
      <div style="height: 10px"></div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px">
        <thead>
          <tr style="text-align: left; color: #475569">
            <th style="padding: 8px; border-bottom: 1px solid #e2e8f0">阀门</th>
            <th style="padding: 8px; border-bottom: 1px solid #e2e8f0">分区</th>
            <th style="padding: 8px; border-bottom: 1px solid #e2e8f0">状态</th>
            <th style="padding: 8px; border-bottom: 1px solid #e2e8f0">电压</th>
            <th style="padding: 8px; border-bottom: 1px solid #e2e8f0">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in devices.valves" :key="v.id">
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ v.id }}</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ v.zone }}</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">
              {{ (valves.get(v.id)?.state ?? "CLOSE") === "OPEN" ? "OPEN" : "CLOSE" }}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ valves.get(v.id)?.batteryV ?? "-" }} V</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">
              <button class="secondary" @click="close(v.id)">关闭</button>
              <button @click="open(v.id)">打开(10min)</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { reactive, watchEffect } from "vue"

const props = defineProps({
  devices: { type: Object, required: true },
  strategy: { type: Object, default: null },
  valves: { type: Object, required: true }
})

const emit = defineEmits(["update-strategy", "set-mode", "open-valve", "close-valve"])

const draft = reactive({ low: 35, high: 45, duration: 600 })

watchEffect(() => {
  if (!props.strategy) return
  draft.low = props.strategy.humidityLowPct
  draft.high = props.strategy.humidityHighPct
  draft.duration = props.strategy.openDurationSec
})

function save() {
  emit("update-strategy", {
    humidityLowPct: Number(draft.low),
    humidityHighPct: Number(draft.high),
    openDurationSec: Number(draft.duration)
  })
}

function open(id) {
  emit("open-valve", id, 600)
}

function close(id) {
  emit("close-valve", id)
}
</script>

