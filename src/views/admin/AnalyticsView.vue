<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { adminService, type AnalyticsData } from '@/services/adminService'

const data = ref<AnalyticsData | null>(null)
const isLoading = ref(true)
const selectedDays = ref(7)

const daysOptions = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
]

async function loadAnalytics() {
  isLoading.value = true
  try {
    data.value = await adminService.getAnalytics(selectedDays.value)
  } catch (e) {
    console.error('Failed to load analytics', e)
  } finally {
    isLoading.value = false
  }
}

function formatTokens(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// SVG chart helpers
const chartWidth = 960
const chartHeight = 200
const chartPadding = { top: 20, right: 20, bottom: 30, left: 10 }

const chartPoints = computed(() => {
  const currentData = data.value
  if (!currentData || !currentData.daily_messages || currentData.daily_messages.length === 0) return ''
  const msgs = currentData.daily_messages
  const maxCount = Math.max(...msgs.map(m => m.count), 1)
  const w = chartWidth - chartPadding.left - chartPadding.right
  const h = chartHeight - chartPadding.top - chartPadding.bottom

  return msgs.map((m, i) => {
    const x = chartPadding.left + (i / Math.max(msgs.length - 1, 1)) * w
    const y = chartPadding.top + h - (m.count / maxCount) * h
    return `${x},${y}`
  }).join(' ')
})

const chartAreaPath = computed(() => {
  const currentData = data.value
  if (!currentData || !currentData.daily_messages || currentData.daily_messages.length === 0) return ''
  const msgs = currentData.daily_messages
  const maxCount = Math.max(...msgs.map(m => m.count), 1)
  const w = chartWidth - chartPadding.left - chartPadding.right
  const h = chartHeight - chartPadding.top - chartPadding.bottom

  const points = msgs.map((m, i) => {
    const x = chartPadding.left + (i / Math.max(msgs.length - 1, 1)) * w
    const y = chartPadding.top + h - (m.count / maxCount) * h
    return { x, y }
  })

  if (points.length === 0) return ''
  const bottomY = chartPadding.top + h
  const firstPoint = points[0]
  if (!firstPoint) return ''
  let path = `M ${firstPoint.x},${bottomY}`
  points.forEach(p => { path += ` L ${p.x},${p.y}` })
  const lastPoint = points[points.length - 1]
  if (lastPoint) {
    path += ` L ${lastPoint.x},${bottomY} Z`
  }
  return path
})

const chartXLabels = computed(() => {
  const currentData = data.value
  if (!currentData || !currentData.daily_messages) return []
  const msgs = currentData.daily_messages
  const w = chartWidth - chartPadding.left - chartPadding.right
  // Show ~7 labels max
  const step = Math.max(1, Math.floor(msgs.length / 7))
  return msgs.filter((_, i) => i % step === 0 || i === msgs.length - 1).map((m) => {
    const index = msgs.indexOf(m)
    return {
      label: formatDateLabel(m.date),
      x: chartPadding.left + (index / Math.max(msgs.length - 1, 1)) * w,
    }
  })
})

function changeDays(val: number) {
  selectedDays.value = val
  loadAnalytics()
}

onMounted(loadAnalytics)
</script>

<template>
  <div class="px-6 py-6 max-w-6xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center text-[#7a7a7a] py-20">Loading analytics...</div>

    <template v-else-if="data">
      <!-- Header row -->
      <div class="flex items-start justify-between mb-1">
        <div>
          <h2 class="text-xl font-semibold text-white">Analytics</h2>
          <div class="flex items-center gap-3 mt-1 text-[13px] text-[#7a7a7a]">
            <span><strong class="text-[#b4b4b4]">{{ data.total_messages }}</strong> messages</span>
            <span><strong class="text-[#b4b4b4]">{{ formatTokens(data.total_tokens) }}</strong> tokens</span>
            <span><strong class="text-[#b4b4b4]">{{ data.total_chats }}</strong> chats</span>
            <span><strong class="text-[#b4b4b4]">{{ data.total_users }}</strong> users</span>
          </div>
        </div>

        <!-- Days selector -->
        <select
          :value="selectedDays"
          @change="changeDays(Number(($event.target as HTMLSelectElement).value))"
          class="bg-[#2f2f2f] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#b4b4b4] focus:outline-none cursor-pointer"
        >
          <option v-for="opt in daysOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <!-- Daily Messages label -->
      <div class="text-[12px] text-[#7a7a7a] mt-4 mb-2">Daily Messages</div>

      <!-- Chart -->
      <div class="bg-[#2f2f2f]/30 rounded-2xl border border-white/[0.04] p-4 mb-6 overflow-hidden">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight + 20}`" class="w-full h-48" preserveAspectRatio="none">
          <!-- Grid lines -->
          <line
            v-for="i in 4"
            :key="'grid-' + i"
            :x1="chartPadding.left"
            :y1="chartPadding.top + ((chartHeight - chartPadding.top - chartPadding.bottom) / 4) * i"
            :x2="chartWidth - chartPadding.right"
            :y2="chartPadding.top + ((chartHeight - chartPadding.top - chartPadding.bottom) / 4) * i"
            stroke="rgba(255,255,255,0.04)"
            stroke-width="1"
          />

          <!-- Area fill -->
          <path
            v-if="chartAreaPath"
            :d="chartAreaPath"
            fill="url(#areaGrad)"
          />

          <!-- Line -->
          <polyline
            v-if="chartPoints"
            :points="chartPoints"
            fill="none"
            stroke="#6366f1"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Dots -->
          <template v-if="data && data.daily_messages && data.daily_messages.length > 0">
            <circle
              v-for="(m, i) in data.daily_messages"
              :key="'dot-' + i"
              :cx="chartPadding.left + (i / Math.max(data.daily_messages.length - 1, 1)) * (chartWidth - chartPadding.left - chartPadding.right)"
              :cy="chartPadding.top + (chartHeight - chartPadding.top - chartPadding.bottom) - (m.count / Math.max(...data.daily_messages.map(x => x.count), 1)) * (chartHeight - chartPadding.top - chartPadding.bottom)"
              r="3"
              fill="#6366f1"
              v-show="m.count > 0"
            />
          </template>

          <!-- X-axis labels -->
          <text
            v-for="(lbl, i) in chartXLabels"
            :key="'xlabel-' + i"
            :x="lbl.x"
            :y="chartHeight + 10"
            text-anchor="middle"
            fill="#7a7a7a"
            font-size="12"
          >{{ lbl.label }}</text>

          <!-- Gradient def -->
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <!-- Tables Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Model Usage -->
        <div>
          <h3 class="text-[14px] font-semibold text-white mb-3">Model Usage</h3>
          <div class="bg-[#2f2f2f]/50 rounded-2xl border border-white/[0.06] overflow-hidden">
            <div class="grid grid-cols-[30px_1fr_90px_80px_60px] gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a] border-b border-white/[0.06]">
              <div>#</div>
              <div>Model</div>
              <div class="text-right">Messages</div>
              <div class="text-right">Tokens</div>
              <div class="text-right">%</div>
            </div>
            <div
              v-for="item in data.model_usage"
              :key="item.rank"
              class="grid grid-cols-[30px_1fr_90px_80px_60px] gap-2 px-4 py-3 items-center border-b border-white/[0.04] last:border-0"
            >
              <div class="text-[13px] text-[#7a7a7a]">{{ item.rank }}</div>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shrink-0">
                  <span class="text-[8px] font-bold text-white">OI</span>
                </div>
                <span class="text-[13px] text-white truncate">{{ item.model }}</span>
              </div>
              <div class="text-[13px] text-[#b4b4b4] text-right">{{ item.messages }}</div>
              <div class="text-[13px] text-[#b4b4b4] text-right">{{ formatTokens(item.tokens) }}</div>
              <div class="text-[13px] text-[#b4b4b4] text-right">{{ item.percentage.toFixed(1) }}%</div>
            </div>
            <div v-if="data.model_usage.length === 0" class="px-4 py-8 text-center text-[#7a7a7a] text-[13px]">
              No model usage data yet.
            </div>
          </div>
        </div>

        <!-- User Activity -->
        <div>
          <h3 class="text-[14px] font-semibold text-white mb-3">User Activity</h3>
          <div class="bg-[#2f2f2f]/50 rounded-2xl border border-white/[0.06] overflow-hidden">
            <div class="grid grid-cols-[30px_1fr_90px_80px] gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a] border-b border-white/[0.06]">
              <div>#</div>
              <div>User</div>
              <div class="text-right">Messages</div>
              <div class="text-right">Tokens</div>
            </div>
            <div
              v-for="item in data.user_activity"
              :key="item.rank"
              class="grid grid-cols-[30px_1fr_90px_80px] gap-2 px-4 py-3 items-center border-b border-white/[0.04] last:border-0"
            >
              <div class="text-[13px] text-[#7a7a7a]">{{ item.rank }}</div>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span class="text-[13px] text-white">{{ item.username }}</span>
              </div>
              <div class="text-[13px] text-[#b4b4b4] text-right">{{ item.messages }}</div>
              <div class="text-[13px] text-[#b4b4b4] text-right">{{ formatTokens(item.tokens) }}</div>
            </div>
            <div v-if="data.user_activity.length === 0" class="px-4 py-8 text-center text-[#7a7a7a] text-[13px]">
              No user activity yet.
            </div>
          </div>
          <p class="text-[11px] text-[#7a7a7a] mt-2 text-center">
            ⓘ Message counts are based on assistant responses.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
