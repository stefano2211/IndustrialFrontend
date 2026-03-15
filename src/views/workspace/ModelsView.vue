<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import modelService, { type Model } from '@/services/modelService'
import { knowledgeService } from '@/services/knowledgeService'
import toolService from '@/services/toolService'

const models = ref<Model[]>([])
const currentModel = ref<Model | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const searchQuery = ref('')
const showAdvanced = ref(false)

// Navigation state: 'list' or 'detail'
const viewMode = ref<'list' | 'detail'>('list')

const knowledgeBases = ref<any[]>([])
const availableTools = ref<any[]>([])

const availableProviders = ref<any[]>([])
const providerModels = ref<any[]>([])
const selectedProviderId = ref('')

onMounted(async () => {
  await fetchData()
  await fetchProviders()
})

async function fetchProviders() {
  try {
    availableProviders.value = await modelService.listProviders()
  } catch (error) {
    console.error('Error fetching providers:', error)
  }
}

async function fetchProviderModels(providerId: string) {
  if (!providerId) return
  try {
    providerModels.value = await modelService.listProviderModels(providerId)
  } catch (error) {
    console.error(`Error fetching models for ${providerId}:`, error)
    providerModels.value = []
  }
}

async function fetchData() {
  try {
    isLoading.value = true
    const [modelsData, kbData, toolsData] = await Promise.all([
      modelService.listModels(),
      knowledgeService.listKnowledgeBases(),
      toolService.listTools()
    ])
    models.value = modelsData
    knowledgeBases.value = kbData
    availableTools.value = toolsData
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredModels = computed(() => {
  return models.value.filter(m => 
    m.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function selectModel(model: Model) {
  currentModel.value = JSON.parse(JSON.stringify(model))
  
  // Parse provider from base_model_id (format "provider:model_id")
  if (currentModel.value?.base_model_id.includes(':')) {
    const [pId] = currentModel.value.base_model_id.split(':')
    selectedProviderId.value = pId
    fetchProviderModels(pId)
  } else {
    selectedProviderId.value = currentModel.value?.base_model_id || ''
    if (selectedProviderId.value) fetchProviderModels(selectedProviderId.value)
  }
  
  viewMode.value = 'detail'
}

function createNewModel() {
  const newModel: Model = {
    id: '',
    name: 'New Model',
    base_model_id: 'openai:gpt-4o',
    description: '',
    tags: [],
    system_prompt: '',
    params: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1.0,
      top_k: 0,
      stop_sequence: ''
    },
    knowledge_ids: [],
    tool_ids: [],
    skill_ids: [],
    capabilities: {
      vision: true,
      file_upload: true,
      file_context: true,
      web_search: true,
      image_generation: true,
      code_interpreter: true,
      usage: false,
      citations: true,
      status_updates: true,
      builtin_tools: true
    },
    default_features: {
      web_search: false,
      image_generation: false,
      code_interpreter: false
    },
    builtin_tools: {
      time_calculation: true,
      memory: true,
      chat_history: true,
      notes: true,
      knowledge_base: true,
      channels: true,
      web_search: true,
      image_generation: true,
      code_interpreter: true
    },
    tts_voice: ''
  }
  currentModel.value = newModel
  viewMode.value = 'detail'
}

async function handleSave() {
  if (!currentModel.value) return
  
  try {
    isSaving.value = true
    isSaving.value = true
    // Check if the model has a non-empty ID and exists in our list
    const exists = currentModel.value.id && models.value.some(m => m.id === currentModel.value?.id)
    
    if (exists) {
      await modelService.updateModel(currentModel.value.id, currentModel.value)
    } else {
      await modelService.createModel(currentModel.value)
    }
    await fetchData()
    viewMode.value = 'list'
    currentModel.value = null
  } catch (error) {
    console.error('Error saving model:', error)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  if (!currentModel.value) return
  if (!confirm(`Are you sure you want to delete ${currentModel.value.name}?`)) return
  
  try {
    await modelService.deleteModel(currentModel.value.id)
    currentModel.value = null
    viewMode.value = 'list'
    await fetchData()
  } catch (error) {
    console.error('Error deleting model:', error)
  }
}

function toggleModelActive(model: Model) {
  // Logic for toggling active state
  console.log('Toggle active for', model.id)
}
</script>

<template>
  <div class="h-full bg-[#0d0d0d] text-[#ececec] overflow-y-auto custom-scrollbar relative font-sans selection:bg-white/10">
    <!-- View 1: List View -->
    <div v-if="viewMode === 'list'" class="max-w-5xl mx-auto px-6 py-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center justify-between mb-10">
        <div>
          <h1 class="text-xl font-bold tracking-tight flex items-center gap-3">
            Models
            <span class="px-2 py-0.5 bg-white/5 rounded-md text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-white/5">{{ models.length }}</span>
          </h1>
          <p class="text-xs text-gray-500 mt-1">Manage and configure your custom AI models</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-all border border-white/5">Import</button>
          <button class="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-all border border-white/5">Export</button>
          <button @click="createNewModel" class="px-4 py-1.5 bg-white text-black hover:bg-gray-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            New Model
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="flex items-center gap-3 mb-8">
        <div class="relative flex-1 max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a5a5a" stroke-width="2.5" class="absolute left-3 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search models..." 
            class="w-full bg-white/03 backdrop-blur-xl border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-white/10 transition-all placeholder:text-gray-600"
          >
        </div>
        <div class="relative group">
          <button class="px-3 py-2 bg-white/03 border border-white/5 rounded-xl text-xs flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            All Providers
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
      </div>

      <!-- Models List -->
      <div class="grid grid-cols-1 gap-2">
        <div 
          v-for="model in filteredModels" 
          :key="model.id"
          class="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] hover:border-white/10 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
          @click="selectModel(model)"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xl transition-transform group-hover:scale-105">
               <div v-if="model.id === 'orchestrator' || model.name.toLowerCase().includes('orchestrator')" class="w-full h-full flex items-center justify-center text-black font-black text-xl">OI</div>
               <span v-else class="text-xl font-bold text-gray-800">{{ model.name.charAt(0) }}</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white tracking-tight">{{ model.name }}</h3>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="text-[11px] text-gray-500 font-medium">By Stefano •</span>
                <span class="text-[11px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{{ model.id }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4" @click.stop>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
            <div 
              @click="toggleModelActive(model)"
              class="w-9 h-5 rounded-full relative transition-all duration-500 cursor-pointer border border-white/5"
              :class="true ? 'bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white/10'"
            >
              <div class="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm" :class="true ? 'translate-x-4' : ''"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-16 pt-8 border-t border-white/5">
        <h2 class="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Discover</h2>
        <div class="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-400"><path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/><path d="m11 8 3 3-3 3"/></svg>
            </div>
            <div>
              <h4 class="text-xs font-bold text-white">Explore Community Hub</h4>
              <p class="text-[11px] text-gray-500">Discover and import high-performance model presets</p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a5a5a" stroke-width="2.5" class="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
    </div>

    <!-- View 2: Detail View -->
    <div v-else-if="currentModel" class="max-w-4xl mx-auto px-6 py-12 pb-48 animate-in fade-in zoom-in-95 duration-500">
      <!-- Top info box -->
      <div class="flex items-start gap-8 mb-12 relative group/header">
        <div class="w-24 h-24 rounded-2xl bg-white flex items-center justify-center relative group overflow-hidden shrink-0 shadow-2xl transition-all border border-white/10 ring-1 ring-white/5 group-hover/header:ring-white/20">
           <div v-if="currentModel.id === 'orchestrator' || currentModel.name.toLowerCase().includes('orchestrator')" class="w-full h-full flex items-center justify-center text-black font-black text-4xl">OI</div>
           <span v-else class="text-4xl font-bold text-gray-800">{{ currentModel.name.charAt(0) }}</span>
           <div class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" class="mb-1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span class="text-white text-[9px] font-black uppercase tracking-wider">Update</span>
           </div>
        </div>
        
        <div class="flex-1 py-1">
          <div class="flex items-center justify-between mb-1">
            <input v-model="currentModel.name" class="bg-transparent text-2xl font-bold text-white border-none focus:outline-none focus:ring-0 p-0 w-full placeholder:text-gray-700 transition-colors focus:placeholder:text-gray-800" placeholder="Untitled Model">
            <button class="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold border border-white/5 transition-all shrink-0 uppercase tracking-widest text-gray-300 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Access
            </button>
          </div>
          <div class="flex items-center gap-2">
             <span class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-600">ID</span>
             <input v-model="currentModel.id" class="bg-transparent text-sm text-gray-500 border-none focus:outline-none focus:ring-0 p-0 font-medium font-mono" placeholder="unique-id-slug">
          </div>
          
          <div class="mt-6 grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Provider</label>
              <div class="relative">
                <select 
                  v-model="selectedProviderId" 
                  @change="fetchProviderModels(selectedProviderId)"
                  class="w-full bg-white/03 border border-white/5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-300 appearance-none focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                >
                   <option value="" disabled>Select Provider</option>
                   <option v-for="p in availableProviders" :key="p.id" :value="p.id" class="bg-[#171717]">{{ p.name }}</option>
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            
            <div>
              <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Base Model</label>
              <div class="relative">
                <select 
                  v-model="currentModel.base_model_id" 
                  class="w-full bg-white/03 border border-white/5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-300 appearance-none focus:outline-none focus:border-white/10 transition-all cursor-pointer shadow-xl"
                >
                   <option value="" disabled>Select Model</option>
                   <option 
                     v-for="m in providerModels" 
                     :key="m.id" 
                     :value="selectedProviderId === 'ollama' ? 'ollama:' + m.id : m.id" 
                     class="bg-[#171717]"
                   >
                     {{ m.name }}
                   </option>
                </select>
                <div v-if="providerModels.length === 0" class="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center pointer-events-none">
                  <span class="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Loading available models...</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sections -->
      <div class="space-y-12">
        <!-- Model Params -->
        <section class="animate-in fade-in slide-in-from-bottom-2 duration-700 bg-white/02 border border-white/03 rounded-2xl p-6 backdrop-blur-3xl">
          <div class="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
             <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-indigo-400"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
                <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Core configuration</h3>
             </div>
          </div>
          
          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold text-white">System Personality</label>
                <span class="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Read-only</span>
              </div>
              <p class="text-[11px] text-gray-500 mb-4 leading-relaxed">Define the primary identity and behavioral constraints of the model.</p>
              <textarea 
                v-model="currentModel.system_prompt" 
                rows="6" 
                class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-xs leading-relaxed focus:outline-none focus:border-white/10 transition-all custom-scrollbar placeholder:text-gray-800" 
                placeholder="You are a precise, technical assistant designed for high-performance engineering tasks..."
              ></textarea>
            </div>
            
            <div class="flex items-center justify-between pt-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-white">Advanced Parameters</span>
                <div class="w-2 h-2 rounded-full bg-green-500/40 animate-pulse"></div>
              </div>
              <button @click="showAdvanced = !showAdvanced" class="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all border border-white/5">
                {{ showAdvanced ? 'Minimize' : 'Expand' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Workspace Links -->
        <div class="grid grid-cols-3 gap-4 pb-20">
           <div v-for="section in ['Knowledge', 'Tools', 'Skills']" :key="section" class="bg-white/02 border border-white/03 rounded-xl p-4 transition-all hover:bg-white/04 group/card">
              <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                {{ section }}
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-gray-700 group-hover/card:text-gray-400 transition-colors"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </h4>
              <p class="text-[10px] text-gray-600 mb-4 leading-tight">Attach custom assets from your workspace.</p>
              <button class="w-full py-1.5 bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-lg text-[10px] font-bold border border-white/5 transition-all transition-colors">
                Link {{ section }}
              </button>
           </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="sticky bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/98 to-transparent pointer-events-none z-30 -mx-6">
        <div class="max-w-4xl mx-auto flex items-center justify-between gap-6 overflow-visible pointer-events-auto px-6">
           <button @click="viewMode = 'list'" class="px-6 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white font-bold rounded-lg transition-all active:scale-[0.98] text-[11px] uppercase tracking-widest border border-white/5">Cancel</button>
           <div class="flex items-center gap-8 flex-1 justify-end">
             <button @click="handleDelete" class="text-[#ed5f5f]/60 hover:text-red-500 font-bold transition-all text-[10px] uppercase tracking-[0.2em]">Delete</button>
             <button @click="handleSave" :disabled="isSaving" class="px-8 py-2.5 bg-white hover:bg-gray-100 disabled:bg-gray-500 text-black font-black text-xs rounded-xl shadow-[0_10px_40px_rgba(255,255,255,0.1)] transition-all transform active:scale-95 leading-none flex items-center gap-2">
                {{ isSaving ? 'Synchronizing...' : 'Save & Publish' }}
                <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
             </button>
           </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State / Loading -->
    <div v-if="isLoading && models.length === 0" class="h-full flex items-center justify-center">
       <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-2 border-white/10 border-t-white/40 rounded-full animate-spin"></div>
          <div class="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Connecting to Neural Engine...</div>
       </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:deep(html), :deep(body) {
  font-family: 'Inter', sans-serif;
}

.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.03); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.08); }

/* Remove default select styling */
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.bg-white\/03 {
  background-color: rgba(255, 255, 255, 0.03);
}

.bg-white\/02 {
  background-color: rgba(255, 255, 255, 0.02);
}

.animate-in {
  animation-duration: 0.5s;
  animation-fill-mode: both;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-bottom {
  from { transform: translateY(10px); }
  to { transform: translateY(0); }
}

@keyframes zoom-in {
  from { transform: scale(0.98); }
  to { transform: scale(1); }
}

.fade-in { animation-name: fade-in; }
.slide-in-from-bottom-4 { animation-name: slide-in-from-bottom; }
.slide-in-from-bottom-2 { animation-name: slide-in-from-bottom; }
.zoom-in-95 { animation-name: zoom-in; }
</style>
