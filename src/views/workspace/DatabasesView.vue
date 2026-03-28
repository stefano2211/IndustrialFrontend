<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dbCollectorService, { type DbSource } from '@/services/dbCollectorService'

const sources = ref<DbSource[]>([])
const isLoading = ref(true)

// Form State
const isAddingSource = ref(false)
const newSource = ref({
  name: '',
  description: '',
  db_type: 'postgresql',
  connection_string: '',
  query: 'SELECT * FROM machinery_telemetry WHERE timestamp > %s',
  cron_expression: '* * * * *',
  is_enabled: true,
  tenant_id: 'aura_tenant_01',
  sector: 'manufacturing',
  domain: 'machinery'
})

const dbTypes = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mongodb', label: 'MongoDB' }
]

async function loadData() {
  isLoading.value = true
  try {
    sources.value = await dbCollectorService.listSources()
  } catch (e) {
    console.error('Failed to load database sources', e)
  } finally {
    isLoading.value = false
  }
}

async function createSource() {
  try {
    const created = await dbCollectorService.createSource(newSource.value)
    sources.value.push(created)
    isAddingSource.value = false
    // Reset form
    newSource.value = {
      name: '',
      description: '',
      db_type: 'postgresql',
      connection_string: '',
      query: 'SELECT * FROM machinery_telemetry WHERE timestamp > %s',
      cron_expression: '* * * * *',
      is_enabled: true,
      tenant_id: 'aura_tenant_01',
      sector: 'manufacturing',
      domain: 'machinery'
    }
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Failed to create database source')
  }
}

async function deleteSource(id: string) {
  if (!confirm('Are you sure you want to delete this database source?')) return
  try {
    await dbCollectorService.deleteSource(id)
    sources.value = sources.value.filter(s => s.id !== id)
  } catch (e) {
    console.error('Failed to delete source', e)
  }
}

async function runSourceNow(id: string) {
  try {
    const res = await dbCollectorService.runSource(id)
    alert(res.message || 'Collection triggered successfully.')
    // Reload to see updated status
    setTimeout(loadData, 2000)
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Failed to trigger collection')
  }
}

async function refreshStatus(id: string) {
  try {
    const updated = await dbCollectorService.getSourceStatus(id)
    const index = sources.value.findIndex(s => s.id === id)
    if (index !== -1) {
      sources.value[index] = updated
    }
  } catch (e) {
    console.error('Failed to refresh status', e)
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleString()
}

onMounted(loadData)
</script>

<template>
  <div class="px-6 py-6 max-w-6xl mx-auto space-y-8 h-full overflow-y-auto custom-scrollbar">
    
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-white tracking-tight">Databases</h2>
        <p class="text-[#7a7a7a] text-sm mt-1">Configure scheduled data collection from your internal databases.</p>
      </div>
      <button 
        @click="isAddingSource = !isAddingSource"
        class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Add Connection
      </button>
    </div>

    <!-- Add Source Form -->
    <transition 
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-4 opacity-0"
    >
      <div v-if="isAddingSource" class="bg-[#2f2f2f]/30 border border-emerald-500/20 rounded-3xl p-6 mb-8 backdrop-blur-sm">
        <h3 class="text-lg font-semibold text-white mb-6">New Database Connection</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div class="space-y-1.5 lg:col-span-2">
            <label class="text-[12px] font-bold text-[#7a7a7a] uppercase ml-1">Name</label>
            <input v-model="newSource.name" type="text" placeholder="e.g. Core Machinery DB" class="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none">
          </div>
          <div class="space-y-1.5 lg:col-span-2">
            <label class="text-[12px] font-bold text-[#7a7a7a] uppercase ml-1">Type</label>
            <select v-model="newSource.db_type" class="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none appearance-none">
              <option v-for="type in dbTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
            </select>
          </div>
          
          <div class="space-y-1.5 lg:col-span-4">
            <label class="text-[12px] font-bold text-[#7a7a7a] uppercase ml-1">Connection String</label>
            <input v-model="newSource.connection_string" type="password" placeholder="postgresql+asyncpg://user:pass@host:5432/dbname" class="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none font-mono text-sm">
          </div>
          
          <div class="space-y-1.5 lg:col-span-4">
            <label class="text-[12px] font-bold text-[#7a7a7a] uppercase ml-1">SQL Query (Incremental)</label>
            <textarea v-model="newSource.query" rows="2" class="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none font-mono text-sm"></textarea>
          </div>

          <div class="space-y-1.5">
            <label class="text-[12px] font-bold text-[#7a7a7a] uppercase ml-1">Cron Schedule</label>
            <input v-model="newSource.cron_expression" type="text" placeholder="* * * * *" class="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none font-mono text-center tracking-widest text-sm">
          </div>

          <div class="space-y-1.5">
            <label class="text-[12px] font-bold text-[#7a7a7a] uppercase ml-1">Tenant ID</label>
            <input v-model="newSource.tenant_id" type="text" class="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none text-sm">
          </div>

          <div class="space-y-1.5">
            <label class="text-[12px] font-bold text-[#7a7a7a] uppercase ml-1">Sector</label>
            <input v-model="newSource.sector" type="text" class="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none text-sm">
          </div>

          <div class="space-y-1.5">
            <label class="text-[12px] font-bold text-[#7a7a7a] uppercase ml-1">Domain</label>
            <input v-model="newSource.domain" type="text" class="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none text-sm">
          </div>
        </div>
        
        <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button @click="isAddingSource = false" class="px-5 py-2 text-[#7a7a7a] hover:text-white transition-colors">Cancel</button>
          <button @click="createSource" :disabled="!newSource.name || !newSource.connection_string || !newSource.query" class="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center justify-center min-w-[140px]">
            Save Connection
          </button>
        </div>
      </div>
    </transition>

    <!-- Sources Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div v-if="isLoading" class="col-span-full py-20 text-center">
        <svg class="animate-spin w-8 h-8 text-emerald-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="text-[#7a7a7a]">Loading database configurations...</p>
      </div>

      <div 
        v-for="source in sources" 
        :key="source.id"
        class="group relative bg-[#2f2f2f]/30 border border-white/[0.06] rounded-3xl p-6 hover:border-emerald-500/30 hover:bg-[#2f2f2f]/50 transition-all overflow-hidden backdrop-blur-sm shadow-xl"
      >
        <!-- Background Decoration -->
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl group-hover:bg-emerald-600/10 transition-all"></div>
        
        <div class="relative flex flex-col h-full z-10">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center border border-white/5 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">{{ source.name }}</h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="px-2 py-0.5 bg-white/5 text-[#a0a0a0] text-[10px] font-bold uppercase tracking-widest rounded">{{ source.db_type }}</span>
                  <span class="px-2 py-0.5 bg-white/5 text-[#a0a0a0] text-[10px] font-bold rounded flex items-center gap-1 font-mono">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ source.cron_expression }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button @click.stop="refreshStatus(source.id)" class="p-2 text-[#4a4a4a] hover:text-white transition-all rounded-lg hover:bg-white/5" title="Refresh Status">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
              <button @click.stop="deleteSource(source.id)" class="p-2 text-[#4a4a4a] hover:text-red-400 transition-all rounded-lg hover:bg-white/5" title="Delete Source">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          
          <div class="mb-5 bg-[#1a1a1a] p-3 rounded-xl border border-white/5">
            <p class="text-[12px] font-mono text-[#7a7a7a] line-clamp-2" title="Query">{{ source.query }}</p>
          </div>
          
          <div class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div>
                <p class="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider mb-1">Status</p>
                <div class="flex items-center gap-1.5">
                  <span 
                    class="w-2 h-2 rounded-full"
                    :class="{
                      'bg-emerald-500': source.last_run_status === 'success',
                      'bg-red-500': source.last_run_status === 'error',
                      'bg-blue-500 animate-pulse': source.last_run_status === 'running',
                      'bg-[#4a4a4a]': !source.last_run_status || source.last_run_status === 'pending'
                    }"
                  ></span>
                  <span class="text-xs font-semibold text-white capitalize">
                    {{ source.last_run_status || 'Never Run' }}
                  </span>
                </div>
              </div>
              
              <div v-if="source.last_run_at" class="border-l border-white/10 pl-4">
                <p class="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider mb-1">Last Run</p>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-[#a0a0a0]">{{ formatDate(source.last_run_at) }}</span>
                  <span v-if="source.last_run_rows !== undefined" class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{{ source.last_run_rows }} rows</span>
                </div>
              </div>
            </div>
            
            <button 
              @click.stop="runSourceNow(source.id)" 
              class="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white font-medium rounded-lg text-xs transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Run Now
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && sources.length === 0" class="col-span-full py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-center">
        <div class="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
          <svg class="text-[#4a4a4a]" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/><ellipse cx="12" cy="5" rx="9" ry="3"/></svg>
        </div>
        <p class="text-white font-medium text-lg mb-2">No databases configured</p>
        <p class="text-[#7a7a7a] mb-6 max-w-sm mx-auto">Connect your industrial databases to automate telemetry harvesting and knowledge base population.</p>
        <button @click="isAddingSource = true" class="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">Configure Your First Database &rarr;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
</style>
