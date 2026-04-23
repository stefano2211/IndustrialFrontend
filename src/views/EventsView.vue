<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import eventService, { type IndustrialEvent, type EventSeverity, type EventStatus, type EventSourceType } from '@/services/eventService'

// ── State ─────────────────────────────────────────────────────────────────────
const events = ref<IndustrialEvent[]>([])
const selectedEvent = ref<IndustrialEvent | null>(null)
const isLoading = ref(false)
const sseConnected = ref(false)
const unreadCount = ref(0)
let sseSource: EventSource | null = null

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
      } else if (payload.event === 'status_update' || payload.event === 'analysis_ready') {
        const id = payload.data?.id
        if (id) {
          const idx = events.value.findIndex(e => e.id === id)
          if (idx !== -1) {
            events.value[idx] = { ...events.value[idx], ...payload.data }
            if (selectedEvent.value?.id === id) {
              selectedEvent.value = { ...selectedEvent.value, ...payload.data }
            }
          } else {
            loadEvents()
          }
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
    <div class="w-[340px] shrink-0 flex flex-col border-r border-white/[0.06] h-full">

      <!-- Header -->
      <div class="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-400 shrink-0"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span class="font-semibold text-[15px]">Eventos</span>
          <span v-if="pendingApprovalCount > 0" class="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {{ pendingApprovalCount }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- SSE indicator -->
          <div class="flex items-center gap-1.5" :title="sseConnected ? 'Stream conectado' : 'Reconectando…'">
            <div class="w-2 h-2 rounded-full" :class="sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'"></div>
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
            <!-- Human-in-the-loop buttons (only for awaiting_approval) -->
            <template v-if="selectedEvent.status === 'awaiting_approval'">
              <button @click="openApproval('approve')" class="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-[13px] font-medium hover:bg-emerald-500/25 transition-colors">
                ✓ Aprobar
              </button>
              <button @click="openApproval('reject')" class="px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-[13px] font-medium hover:bg-red-500/25 transition-colors">
                ✕ Rechazar
              </button>
            </template>
          </div>
        </div>

        <!-- Detail body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <!-- Meta row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
              <div class="text-[11px] text-[#7a7a7a] mb-1">Creado</div>
              <div class="text-[13px] text-[#ececec]">{{ formatDate(selectedEvent.created_at) }}</div>
            </div>
            <div class="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
              <div class="text-[11px] text-[#7a7a7a] mb-1">Actualizado</div>
              <div class="text-[13px] text-[#ececec]">{{ formatDate(selectedEvent.updated_at) }}</div>
            </div>
            <div class="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
              <div class="text-[11px] text-[#7a7a7a] mb-1">Fuente</div>
              <div class="text-[13px] text-[#ececec] capitalize">{{ selectedEvent.source_type }}</div>
            </div>
            <div class="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
              <div class="text-[11px] text-[#7a7a7a] mb-1">Resuelto</div>
              <div class="text-[13px] text-[#ececec]">{{ selectedEvent.resolved_at ? formatDate(selectedEvent.resolved_at) : '—' }}</div>
            </div>
          </div>

          <!-- Raw payload -->
          <div v-if="selectedEvent.raw_payload" class="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
            <div class="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#7a7a7a]"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
              <span class="text-[12px] font-medium text-[#b4b4b4]">Payload original</span>
            </div>
            <pre class="px-4 py-3 text-[12px] text-[#ececec] overflow-x-auto leading-relaxed">{{ JSON.stringify(selectedEvent.raw_payload, null, 2) }}</pre>
          </div>

          <!-- Agent analysis -->
          <div v-if="selectedEvent.agent_analysis" class="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
            <div class="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span class="text-[12px] font-medium text-[#b4b4b4]">Análisis del agente</span>
            </div>
            <div class="px-4 py-3 text-[13px] text-[#ececec] leading-relaxed whitespace-pre-wrap">{{ selectedEvent.agent_analysis }}</div>
          </div>

          <!-- Agent plan -->
          <div v-if="selectedEvent.agent_plan" class="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
            <div class="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-400"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span class="text-[12px] font-medium text-[#b4b4b4]">Plan de remediación</span>
            </div>
            <div class="px-4 py-3 text-[13px] text-[#ececec] leading-relaxed whitespace-pre-wrap">{{ selectedEvent.agent_plan }}</div>
          </div>

          <!-- Actions taken -->
          <div v-if="selectedEvent.actions_taken?.length" class="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
            <div class="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span class="text-[12px] font-medium text-[#b4b4b4]">Acciones ejecutadas</span>
            </div>
            <div class="px-4 py-3 space-y-2">
              <div v-for="(action, idx) in selectedEvent.actions_taken" :key="idx" class="text-[12px] text-[#ececec] bg-white/[0.04] rounded-lg p-2.5 border border-white/[0.06]">
                <span class="text-[#7a7a7a]">{{ action.type }}</span>
                <span v-if="action.timestamp" class="text-[#7a7a7a] ml-2 text-[11px]">{{ formatDate(action.timestamp) }}</span>
                <p v-if="action.content" class="mt-1 text-[#ececec] leading-relaxed">{{ action.content }}</p>
              </div>
            </div>
          </div>

          <!-- Analyzing spinner -->
          <div v-if="selectedEvent.status === 'analyzing' || selectedEvent.status === 'executing'" class="flex items-center gap-3 text-[13px] text-[#b4b4b4] py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin shrink-0"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            {{ selectedEvent.status === 'analyzing' ? 'El agente está analizando el evento…' : 'Ejecutando plan de remediación…' }}
          </div>

        </div>
      </template>
    </div>

    <!-- ── Create event modal ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showCreateModal = false">
        <div class="bg-[#1c1c1c] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <h3 class="text-[16px] font-semibold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-400"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Nuevo evento manual
          </h3>
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
              <input v-model="newEvent.title" type="text" placeholder="Descripción corta del evento" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] text-[#ececec] placeholder-[#7a7a7a] focus:outline-none focus:border-white/20" />
            </div>
            <div>
              <label class="text-[12px] text-[#7a7a7a] mb-1 block">Descripción</label>
              <textarea v-model="newEvent.description" rows="3" placeholder="Contexto detallado…" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] text-[#ececec] placeholder-[#7a7a7a] focus:outline-none focus:border-white/20 resize-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            <button @click="showCreateModal = false" class="px-4 py-2 text-[13px] text-[#b4b4b4] hover:text-white transition-colors">Cancelar</button>
            <button @click="createManualEvent" :disabled="isCreating || !newEvent.title.trim()" class="px-4 py-2 bg-orange-500/20 border border-orange-500/40 text-orange-400 rounded-xl text-[13px] font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg v-if="isCreating" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin inline mr-1"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Crear evento
            </button>
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
