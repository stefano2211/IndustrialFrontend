<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import eventService, { type IndustrialEvent, type EventSeverity, type EventStatus, type EventSourceType, type SyntheticPreset, SYNTHETIC_PRESETS } from '@/services/eventService'

// ── State ─────────────────────────────────────────────────────────────────────
const events = ref<IndustrialEvent[]>([])
const selectedEvent = ref<IndustrialEvent | null>(null)
const isLoading = ref(false)
const sseConnected = ref(false)
const unreadCount = ref(0)
let sseSource: EventSource | null = null

// Live VLM Viewer State
interface LiveScreenshot { b64: string; step: number; action?: string; click?: { x: number; y: number; type: string } }
const liveScreenshot = ref<LiveScreenshot | null>(null)

// Filters
const filterSeverity = ref<EventSeverity | ''>('')
const filterStatus = ref<EventStatus | ''>('')
const filterSource = ref<EventSourceType | ''>('')

// Modals
const showCreateModal = ref(false)
const showApprovalModal = ref(false)
const approvalNotes = ref('')
const approvalAction = ref<'approve' | 'reject'>('approve')

// Create form
const newEvent = ref({ severity: 'medium' as EventSeverity, title: '', description: '' })
const isCreating = ref(false)
const createTab = ref<'presets' | 'custom'>('presets')
const presets = SYNTHETIC_PRESETS
const triggeringPresetId = ref<string | null>(null)

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredEvents = computed(() => {
  return events.value.filter(e => {
    if (filterSeverity.value && e.severity !== filterSeverity.value) return false
    if (filterStatus.value && e.status !== filterStatus.value) return false
    if (filterSource.value && e.source_type !== filterSource.value) return false
    return true
  })
})

const pendingApprovalCount = computed(() =>
  events.value.filter(e => e.status === 'awaiting_approval').length
)

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadEvents() {
  isLoading.value = true
  try {
    const res = await eventService.listEvents({ limit: 100 })
    events.value = res.items
  } catch (err) {
    console.error('Failed to load events', err)
  } finally {
    isLoading.value = false
  }
}

async function refreshSelected() {
  if (!selectedEvent.value) return
  try {
    selectedEvent.value = await eventService.getEvent(selectedEvent.value.id)
    const idx = events.value.findIndex(e => e.id === selectedEvent.value!.id)
    if (idx !== -1) events.value[idx] = selectedEvent.value
  } catch {}
}

// ── SSE ───────────────────────────────────────────────────────────────────────
function connectSSE() {
  if (sseSource) sseSource.close()
  sseSource = eventService.openSSEStream(
    (payload) => {
      if (payload.event === 'connected') {
        sseConnected.value = true
        return
      }
      if (payload.event === 'new_event') {
        unreadCount.value++
        loadEvents()
      } else if (payload.event === 'screenshot') {
        const id = payload.data?.id
        if (selectedEvent.value?.id === id) {
          liveScreenshot.value = payload.data
        }
      } else if (payload.event === 'status_update' || payload.event === 'analysis_ready') {
        const id = payload.data?.id
        if (id) {
          const idx = events.value.findIndex(e => e.id === id)
          if (idx !== -1) {
            // Merge SSE partial data immediately for responsive UI
            events.value[idx] = { ...events.value[idx], ...payload.data }
            if (selectedEvent.value?.id === id) {
              selectedEvent.value = { ...selectedEvent.value, ...payload.data }
              if (payload.data.status && payload.data.status !== 'executing') {
                liveScreenshot.value = null
              }
            }
          }
          // Always do a full refresh from API to get all fields (the SSE may
          // only carry the most important ones; the DB has the complete state).
          if (selectedEvent.value?.id === id) {
            refreshSelected()
          }
          loadEvents()
        }
      }
    },
    () => {
      sseConnected.value = false
      setTimeout(connectSSE, 5000)
    }
  )
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function createManualEvent() {
  if (!newEvent.value.title.trim()) return
  isCreating.value = true
  try {
    await eventService.createManualEvent(newEvent.value)
    showCreateModal.value = false
    newEvent.value = { severity: 'medium', title: '', description: '' }
    await loadEvents()
  } catch (err) {
    console.error('Failed to create event', err)
  } finally {
    isCreating.value = false
  }
}

async function triggerPreset(preset: SyntheticPreset) {
  triggeringPresetId.value = preset.id
  try {
    const created = await eventService.triggerPreset(preset)
    showCreateModal.value = false
    await loadEvents()
    // Auto-select the newly created event
    const ev = events.value.find(e => e.id === created.id)
    if (ev) selectEvent(ev)
  } catch (err) {
    console.error('Failed to trigger preset', err)
  } finally {
    triggeringPresetId.value = null
  }
}

async function openApproval(action: 'approve' | 'reject') {
  approvalAction.value = action
  approvalNotes.value = ''
  showApprovalModal.value = true
}

async function confirmApproval() {
  if (!selectedEvent.value) return
  try {
    const payload = { notes: approvalNotes.value || undefined }
    if (approvalAction.value === 'approve') {
      selectedEvent.value = await eventService.approveEvent(selectedEvent.value.id, payload)
    } else {
      selectedEvent.value = await eventService.rejectEvent(selectedEvent.value.id, payload)
    }
    showApprovalModal.value = false
    const idx = events.value.findIndex(e => e.id === selectedEvent.value!.id)
    if (idx !== -1) events.value[idx] = selectedEvent.value
  } catch (err) {
    console.error('Approval action failed', err)
  }
}

function selectEvent(event: IndustrialEvent) {
  selectedEvent.value = event
  unreadCount.value = 0
  liveScreenshot.value = null // clear when changing events
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  loadEvents()
  connectSSE()
})

onUnmounted(() => {
  sseSource?.close()
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function severityColor(s: EventSeverity) {
  return {
    low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  }[s] ?? 'bg-gray-500/15 text-gray-400'
}

function severityDot(s: EventSeverity) {
  return {
    low: 'bg-emerald-400',
    medium: 'bg-amber-400',
    high: 'bg-orange-400',
    critical: 'bg-red-400',
  }[s] ?? 'bg-gray-400'
}

function statusColor(s: EventStatus) {
  return {
    pending: 'text-gray-400',
    analyzing: 'text-blue-400',
    awaiting_approval: 'text-amber-400',
    executing: 'text-purple-400',
    completed: 'text-emerald-400',
    failed: 'text-red-400',
  }[s] ?? 'text-gray-400'
}

function statusLabel(s: EventStatus) {
  return {
    pending: 'Pendiente',
    analyzing: 'Analizando…',
    awaiting_approval: 'Esperando aprobación',
    executing: 'Ejecutando…',
    completed: 'Completado',
    failed: 'Fallido',
  }[s] ?? s
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex h-full bg-[#0f0f0f] text-white overflow-hidden">

    <!-- ── LEFT: Event list ─────────────────────────────────────────────── -->
    <div class="w-[340px] shrink-0 flex flex-col border-r border-white/[0.06] h-full bg-[#0d0d0d]">

      <!-- Header -->
      <div class="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-[15px] text-white tracking-tight">Operations Center</span>
          <span v-if="pendingApprovalCount > 0" class="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {{ pendingApprovalCount }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- SSE indicator -->
          <div class="flex items-center gap-1.5" :title="sseConnected ? 'Live' : 'Reconnecting…'">
            <div class="w-1.5 h-1.5 rounded-full" :class="sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'"></div>
            <span class="text-[10px] text-[#666] uppercase tracking-wider">{{ sseConnected ? 'LIVE' : 'OFFLINE' }}</span>
          </div>
          <button
            @click="showCreateModal = true"
            class="p-1.5 hover:bg-white/8 rounded-lg transition-colors text-[#b4b4b4] hover:text-white"
            title="Nuevo evento manual"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
          <button @click="loadEvents" class="p-1.5 hover:bg-white/8 rounded-lg transition-colors text-[#b4b4b4] hover:text-white" title="Refrescar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="isLoading && 'animate-spin'"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="px-3 py-2 border-b border-white/[0.06] flex gap-2 flex-wrap">
        <select v-model="filterSeverity" class="text-[12px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[#ececec] focus:outline-none focus:border-white/20">
          <option value="">Severidad</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>
        <select v-model="filterStatus" class="text-[12px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[#ececec] focus:outline-none focus:border-white/20">
          <option value="">Estado</option>
          <option value="pending">Pendiente</option>
          <option value="analyzing">Analizando</option>
          <option value="awaiting_approval">Aprobación</option>
          <option value="executing">Ejecutando</option>
          <option value="completed">Completado</option>
          <option value="failed">Fallido</option>
        </select>
        <select v-model="filterSource" class="text-[12px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[#ececec] focus:outline-none focus:border-white/20">
          <option value="">Fuente</option>
          <option value="sensor">Sensor</option>
          <option value="db_collector">DB Collector</option>
          <option value="manual">Manual</option>
          <option value="webhook">Webhook</option>
        </select>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="isLoading && filteredEvents.length === 0" class="flex items-center justify-center h-24 text-[#7a7a7a] text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin mr-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Cargando…
        </div>
        <div v-else-if="filteredEvents.length === 0" class="flex flex-col items-center justify-center h-32 text-[#7a7a7a] text-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Sin eventos
        </div>
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          @click="selectEvent(event)"
          class="px-3 py-3 border-b border-white/[0.04] cursor-pointer transition-colors group"
          :class="selectedEvent?.id === event.id ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'"
        >
          <div class="flex items-start gap-2.5">
            <div class="mt-1.5 w-2 h-2 rounded-full shrink-0" :class="severityDot(event.severity)"></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-[13px] font-medium text-[#ececec] truncate flex-1">{{ event.title }}</span>
                <span class="text-[11px] shrink-0" :class="statusColor(event.status)">
                  <span v-if="event.status === 'analyzing'" class="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-1"></span>
                  <span v-if="event.status === 'executing'" class="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse mr-1"></span>
                  {{ statusLabel(event.status) }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-[12px] text-[#7a7a7a]">
                <span :class="['px-1.5 py-0.5 rounded text-[10px] font-semibold border', severityColor(event.severity)]">{{ event.severity.toUpperCase() }}</span>
                <span class="truncate">{{ event.source_type }}</span>
                <span class="ml-auto shrink-0 text-[11px]">{{ formatDate(event.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── RIGHT: Event detail ──────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Empty state -->
      <div v-if="!selectedEvent" class="flex-1 flex flex-col items-center justify-center text-[#7a7a7a] gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <p class="text-sm">Selecciona un evento para ver el detalle</p>
      </div>

      <template v-else>
        <!-- Detail header -->
        <div class="px-6 py-4 border-b border-white/[0.06] flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span :class="['px-2 py-0.5 rounded text-[11px] font-bold border', severityColor(selectedEvent.severity)]">
                {{ selectedEvent.severity.toUpperCase() }}
              </span>
              <span class="text-[12px]" :class="statusColor(selectedEvent.status)">● {{ statusLabel(selectedEvent.status) }}</span>
              <span class="text-[12px] text-[#7a7a7a]">{{ selectedEvent.source_type }}</span>
            </div>
            <h2 class="text-[16px] font-semibold text-white leading-snug">{{ selectedEvent.title }}</h2>
            <p class="text-[13px] text-[#b4b4b4] mt-1">{{ selectedEvent.description }}</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button @click="refreshSelected" class="p-2 hover:bg-white/8 rounded-lg transition-colors text-[#b4b4b4] hover:text-white" title="Refrescar">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            </button>
          </div>
        </div>

        <!-- Detail body (LEDGER UI) -->
        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-[#0a0a0a]">

          <!-- Meta row -->
          <div class="flex items-center gap-5 flex-wrap px-4 py-3 bg-[#111] border border-white/[0.06] rounded-xl text-[12px] text-[#7a7a7a]">
            <div class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-white/20"></span>Creado: <span class="text-[#ececec]">{{ formatDate(selectedEvent.created_at) }}</span></div>
            <div class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-white/20"></span>Actualizado: <span class="text-[#ececec]">{{ formatDate(selectedEvent.updated_at) }}</span></div>
            <div class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-white/20"></span>Fuente: <span class="text-[#ececec] capitalize">{{ selectedEvent.source_type }}</span></div>
            <div v-if="selectedEvent.resolved_at" class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>Resuelto: <span class="text-[#ececec]">{{ formatDate(selectedEvent.resolved_at) }}</span></div>
          </div>

          <!-- 1. Payload / Sensor Telemetry -->
          <div v-if="selectedEvent.raw_payload" class="bg-[#111] rounded-xl border border-white/[0.08] overflow-hidden shadow-sm">
            <div class="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#7a7a7a]"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
              <span class="text-[12px] font-semibold text-[#b4b4b4] uppercase tracking-wider">Payload / Sensor Telemetry</span>
            </div>
            <pre class="px-5 py-4 text-[12.5px] text-[#a0a0a0] font-mono overflow-x-auto leading-relaxed">{{ JSON.stringify(selectedEvent.raw_payload, null, 2) }}</pre>
          </div>

          <!-- 2. System Analysis (Fast Intuition & Deep Reasoning) -->
          <div v-if="selectedEvent.agent_analysis" class="bg-[#111] rounded-xl border border-blue-500/20 overflow-hidden shadow-[0_4px_20px_rgba(59,130,246,0.04)]">
            <div class="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-blue-500/15 flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span class="text-[12px] font-bold text-blue-400 uppercase tracking-widest">System Analysis</span>
              <span class="text-[10px] text-blue-500/60 ml-1">(Fast Intuition & Deep Reasoning)</span>
            </div>
            <div class="px-5 py-4 text-[13px] text-[#d8d8d8] font-mono leading-relaxed whitespace-pre-wrap border-l-2 border-blue-500/25 ml-4 pl-4 my-2">{{ selectedEvent.agent_analysis }}</div>
          </div>

          <!-- 3. Execution Plan (LLM Planner) -->
          <div v-if="selectedEvent.agent_plan" class="bg-[#111] rounded-xl border border-emerald-500/20 overflow-hidden shadow-[0_4px_20px_rgba(16,185,129,0.04)]">
            <div class="px-4 py-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-emerald-500/15 flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span class="text-[12px] font-bold text-emerald-400 uppercase tracking-widest">Execution Plan</span>
              <span class="text-[10px] text-emerald-500/60 ml-1">(LLM Planner)</span>
            </div>
            <div class="px-5 py-4 text-[13px] text-[#d8d8d8] font-mono leading-relaxed whitespace-pre-wrap border-l-2 border-emerald-500/25 ml-4 pl-4 my-2">{{ selectedEvent.agent_plan }}</div>
          </div>

          <!-- 4. DEV_MODE PAUSED — Human-in-the-Loop -->
          <div v-if="selectedEvent.status === 'awaiting_approval'" class="bg-[#15120a] rounded-2xl border border-amber-500/40 overflow-hidden shadow-[0_10px_30px_rgba(245,158,11,0.08)] relative">
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
            <div class="px-6 py-8 flex flex-col items-center justify-center text-center relative z-10">
              <div class="flex items-center gap-3 mb-3">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]"></span>
                </span>
                <h3 class="text-[18px] font-black text-amber-400 uppercase tracking-widest">DEV_MODE PAUSED</h3>
              </div>
              <p class="text-[14px] text-[#b4b4b4] mb-6 max-w-md leading-relaxed">El sistema se ha detenido tras la generación del plan. Revisa el análisis y plan arriba. Haz clic en <strong class="text-amber-300">Continuar</strong> para delegar el control al Agente de Visión (VLM).</p>
              <div class="flex gap-4">
                <button @click="openApproval('reject')" class="px-6 py-3 rounded-xl text-[14px] font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 cursor-pointer">✕ Rechazar</button>
                <button @click="openApproval('approve')" class="px-8 py-3 rounded-xl text-[14px] font-bold bg-amber-500 text-[#111] hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 cursor-pointer">▶ Continuar Ejecución</button>
              </div>
            </div>
          </div>

          <!-- 5. Live Execution Viewer (VLM) -->
          <div v-if="selectedEvent.status === 'executing' && liveScreenshot" class="relative bg-[#050505] rounded-xl border border-purple-500/40 overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20 group">
            <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 z-20 mix-blend-overlay"></div>
            <div class="px-5 py-3 bg-gradient-to-r from-purple-500/15 to-transparent border-b border-purple-500/20 flex items-center justify-between gap-4 relative z-30 backdrop-blur-md">
              <div class="flex items-center gap-3">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,1)]"></span>
                </span>
                <span class="text-[13px] font-bold text-purple-300 tracking-widest uppercase">Aura Visión Activa</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-200 ml-1 border border-purple-500/30 font-mono">STEP {{ liveScreenshot.step }}</span>
              </div>
              <div v-if="liveScreenshot.action" class="text-[12px] text-purple-200 font-mono bg-black/60 px-3 py-1.5 rounded-lg truncate max-w-[60%] border border-white/10 shadow-inner">
                <span class="text-purple-400 mr-2">❯</span>{{ liveScreenshot.action }}
              </div>
            </div>
            <div class="relative w-full bg-[#000] flex justify-center items-center overflow-hidden min-h-[350px]">
              <img :src="`data:image/png;base64,${liveScreenshot.b64}`" class="w-full h-auto max-h-[70vh] object-contain transition-opacity duration-300 z-10" alt="Live screen" />
              <template v-if="liveScreenshot.click">
                <div class="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none z-30 transition-all duration-300" :style="`left: ${liveScreenshot.click.x}%; top: ${liveScreenshot.click.y}%`">
                  <div class="absolute inset-0 rounded-full border-2 border-orange-400 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                  <div class="absolute inset-0 rounded-full bg-orange-500/30 backdrop-blur-sm border border-orange-300/50 shadow-[0_0_15px_rgba(249,115,22,0.8)]"></div>
                  <div class="absolute inset-[6px] rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,1)]"></div>
                </div>
              </template>
            </div>
          </div>

          <!-- Analyzing / Connecting spinner -->
          <div v-if="(selectedEvent.status === 'analyzing' || selectedEvent.status === 'executing') && !liveScreenshot" class="flex items-center gap-3 py-4 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin shrink-0 text-blue-400"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span class="font-mono text-[12px] text-[#b4b4b4] tracking-wide">{{ selectedEvent.status === 'analyzing' ? 'AGENT EXPERT IS ANALYZING EVENT...' : 'INITIALIZING VLM COMPUTER USE LOOP...' }}</span>
          </div>

          <!-- 6. Execution Log (Actions taken) -->
          <div v-if="selectedEvent.actions_taken?.length" class="bg-[#111] rounded-xl border border-white/[0.08] overflow-hidden shadow-sm">
            <div class="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#7a7a7a]"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span class="text-[12px] font-semibold text-[#b4b4b4] uppercase tracking-wider">Execution Log</span>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div v-for="(action, idx) in selectedEvent.actions_taken" :key="idx" class="text-[12.5px] text-[#ececec] font-mono bg-black/40 rounded-lg p-3 border border-white/[0.04]">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-purple-400 font-bold uppercase tracking-wider text-[11px]">{{ action.type }}</span>
                  <span v-if="action.timestamp" class="text-[#555] text-[10px]">{{ formatDate(action.timestamp) }}</span>
                </div>
                <p v-if="action.content" class="text-[#c0c0c0] leading-relaxed">{{ action.content }}</p>
                <p v-else-if="action.result" class="text-[#c0c0c0] leading-relaxed">{{ action.result }}</p>
              </div>
            </div>
          </div>

        </div>
      </template>
    </div>

    <!-- ── Create event modal (Presets + Custom) ──────────────────────────── -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showCreateModal = false">
        <div class="bg-[#141414] border border-white/[0.1] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
          <!-- Modal header -->
          <div class="px-6 pt-5 pb-0">
            <h3 class="text-[16px] font-semibold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-400"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Nuevo Evento
            </h3>
            <!-- Tabs -->
            <div class="flex gap-0 border-b border-white/[0.06]">
              <button @click="createTab = 'presets'" class="px-4 py-2.5 text-[13px] font-medium transition-colors relative" :class="createTab === 'presets' ? 'text-orange-400' : 'text-[#7a7a7a] hover:text-white'">
                ⚡ Presets Sintéticos
                <div v-if="createTab === 'presets'" class="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-400 rounded-t"></div>
              </button>
              <button @click="createTab = 'custom'" class="px-4 py-2.5 text-[13px] font-medium transition-colors relative" :class="createTab === 'custom' ? 'text-blue-400' : 'text-[#7a7a7a] hover:text-white'">
                ✎ Evento Personalizado
                <div v-if="createTab === 'custom'" class="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-400 rounded-t"></div>
              </button>
            </div>
          </div>

          <!-- Tab: Synthetic Presets -->
          <div v-if="createTab === 'presets'" class="px-6 py-4">
            <p class="text-[12px] text-[#666] mb-3">Selecciona un escenario para inyectar datos sintéticos. El análisis, plan y ejecución serán procesados por la IA real del backend.</p>
            <div class="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
              <button
                v-for="p in presets"
                :key="p.id"
                @click="triggerPreset(p)"
                :disabled="triggeringPresetId !== null"
                class="text-left bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-3 transition-all duration-150 group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-[16px]">{{ p.icon }}</span>
                  <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border" :class="severityColor(p.severity)">{{ p.severity }}</span>
                  <svg v-if="triggeringPresetId === p.id" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin text-orange-400 ml-auto"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                </div>
                <div class="text-[12px] text-[#d8d8d8] font-medium leading-snug group-hover:text-white transition-colors">{{ p.label }}</div>
                <div class="text-[10px] text-[#555] mt-1 leading-snug line-clamp-2">{{ p.title }}</div>
              </button>
            </div>
          </div>

          <!-- Tab: Custom event -->
          <div v-if="createTab === 'custom'" class="px-6 py-4">
            <div class="space-y-3">
              <div>
                <label class="text-[12px] text-[#7a7a7a] mb-1 block">Severidad</label>
                <select v-model="newEvent.severity" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] text-[#ececec] focus:outline-none focus:border-white/20">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
              <div>
                <label class="text-[12px] text-[#7a7a7a] mb-1 block">Título *</label>
                <input v-model="newEvent.title" type="text" placeholder="Descripción corta del evento" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] text-[#ececec] placeholder-[#555] focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label class="text-[12px] text-[#7a7a7a] mb-1 block">Descripción</label>
                <textarea v-model="newEvent.description" rows="3" placeholder="Contexto detallado…" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] text-[#ececec] placeholder-[#555] focus:outline-none focus:border-white/20 resize-none"></textarea>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-5">
              <button @click="showCreateModal = false" class="px-4 py-2 text-[13px] text-[#7a7a7a] hover:text-white transition-colors">Cancelar</button>
              <button @click="createManualEvent" :disabled="isCreating || !newEvent.title.trim()" class="px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-xl text-[13px] font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <svg v-if="isCreating" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin inline mr-1"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Enviar al Backend
              </button>
            </div>
          </div>

          <!-- Footer hint -->
          <div class="px-6 py-3 bg-white/[0.02] border-t border-white/[0.06] text-[11px] text-[#555] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Los datos de entrada son sintéticos. El análisis System 1 & 2 y la ejecución VLM son procesados por la IA real.
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Approval modal ─────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showApprovalModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showApprovalModal = false">
        <div class="bg-[#1c1c1c] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <h3 class="text-[16px] font-semibold text-white mb-1">
            {{ approvalAction === 'approve' ? '✓ Aprobar evento' : '✕ Rechazar evento' }}
          </h3>
          <p class="text-[13px] text-[#7a7a7a] mb-4">{{ selectedEvent?.title }}</p>
          <div>
            <label class="text-[12px] text-[#7a7a7a] mb-1 block">Notas (opcional)</label>
            <textarea v-model="approvalNotes" rows="3" placeholder="Motivo o contexto adicional…" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] text-[#ececec] placeholder-[#7a7a7a] focus:outline-none focus:border-white/20 resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button @click="showApprovalModal = false" class="px-4 py-2 text-[13px] text-[#b4b4b4] hover:text-white transition-colors">Cancelar</button>
            <button
              @click="confirmApproval"
              class="px-4 py-2 rounded-xl text-[13px] font-medium transition-colors"
              :class="approvalAction === 'approve'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'"
            >
              {{ approvalAction === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
