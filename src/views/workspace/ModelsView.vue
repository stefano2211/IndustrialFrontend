<script setup lang="ts">
import { ref, onMounted } from 'vue'
import modelService, { type ModelConfig } from '@/services/modelService'

const configs = ref<ModelConfig[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const searchQuery = ref('')

const roles = [
  { id: 'orchestrator', label: 'Orchestrator (Main Agent)' },
  { id: 'subagent', label: 'Sub-agents (Knowledge Agents)' }
]

const providers = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic (Claude)' },
  { id: 'gemini', label: 'Google (Gemini)' },
  { id: 'openrouter', label: 'OpenRouter' }
]

const commonModels: Record<string, string[]> = {
  openai: ['gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  gemini: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  openrouter: ['qwen/qwen3-vl-30b-a3b-thinking', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001']
}

const showSuccess = ref<Record<string, boolean>>({
  orchestrator: false,
  subagent: false
})

onMounted(async () => {
  await fetchConfigs()
})

async function fetchConfigs() {
  try {
    isLoading.value = true
    const data = await modelService.listConfigs()
    
    roles.forEach(role => {
      const existing = data.find(c => c.role === role.id)
      if (existing) {
        configs.value.push({ ...existing })
      } else {
        configs.value.push({ role: role.id, provider: 'openai', model_name: 'gpt-4o' })
      }
    })
  } catch (error) {
    console.error('Error fetching model configs:', error)
  } finally {
    isLoading.value = false
  }
}

async function saveConfig(role: string) {
  const config = configs.value.find(c => c.role === role)
  if (!config) return

  try {
    isSaving.value = true
    await modelService.setConfig(role, { 
      provider: config.provider, 
      model_name: config.model_name 
    })
    
    showSuccess.value[role] = true
    setTimeout(() => {
      showSuccess.value[role] = false
    }, 3000)
  } catch (error) {
    console.error('Error saving model config:', error)
  } finally {
    isSaving.value = false
  }
}

function handleProviderChange(role: string) {
  const config = configs.value.find(c => c.role === role)
  if (config) {
    const models = commonModels[config.provider]
    if (models && models.length > 0) {
      config.model_name = models[0]
    }
  }
}
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto">
    <!-- Section Header (like Open WebUI: "Models 2") -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-semibold text-white">Models</h2>
        <span class="text-[14px] text-[#7a7a7a] font-medium">{{ configs.length }}</span>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a7a]"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Search Models" 
        class="w-full bg-transparent border border-white/[0.08] rounded-xl pl-11 pr-4 py-2.5 text-[14px] text-[#ececec] placeholder-[#7a7a7a] focus:outline-none focus:border-white/20 transition-colors"
      >
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="role in roles" 
        :key="role.id"
        class="bg-[#2f2f2f]/50 border border-white/[0.06] rounded-2xl p-6"
      >
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-[16px] font-medium text-white">{{ role.label }}</h3>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            <span class="text-[11px] text-[#7a7a7a] uppercase font-semibold tracking-wider">Active</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Provider Select -->
          <div>
            <label class="block text-[12px] font-medium text-[#7a7a7a] mb-2 ml-0.5">Provider</label>
            <div class="relative">
              <select 
                :value="configs.find(c => c.role === role.id)?.provider"
                @change="(e) => {
                  const target = e.target as HTMLSelectElement;
                  const config = configs.find(c => c.role === role.id);
                  if (config) {
                    config.provider = target.value;
                    handleProviderChange(role.id);
                  }
                }"
                class="w-full bg-[#212121] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white appearance-none focus:outline-none focus:border-white/20 transition-all cursor-pointer"
              >
                <option v-for="p in providers" :key="p.id" :value="p.id" class="bg-[#212121]">{{ p.label }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7a7a7a]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <!-- Model Select / Input -->
          <div>
            <label class="block text-[12px] font-medium text-[#7a7a7a] mb-2 ml-0.5">Model</label>
            <div class="relative">
              <input 
                :value="configs.find(c => c.role === role.id)?.model_name"
                @input="(e) => {
                  const target = e.target as HTMLInputElement;
                  const config = configs.find(c => c.role === role.id);
                  if (config) config.model_name = target.value;
                }"
                list="model-options"
                class="w-full bg-[#212121] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-[#7a7a7a]"
                placeholder="Type or select a model"
              >
              <datalist id="model-options">
                <option 
                  v-for="m in commonModels[configs.find(c => c.role === role.id)?.provider || 'openai']" 
                  :key="m" 
                  :value="m"
                />
              </datalist>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <!-- Success Message -->
          <transition name="fade">
            <div 
              v-if="showSuccess[role.id]" 
              class="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 text-[13px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span class="font-medium">Saved</span>
            </div>
          </transition>

          <button 
            @click="saveConfig(role.id)"
            :disabled="isSaving"
            class="px-5 py-2 bg-white text-black rounded-xl text-[13px] font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            <svg v-if="isSaving" class="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Info Alert -->
    <div class="mt-6 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl flex gap-3 items-start">
      <div class="p-1.5 bg-white/5 rounded-lg shrink-0 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#7a7a7a]"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      </div>
      <div>
        <p class="text-[13px] font-medium text-white">API Key Reminder</p>
        <p class="text-[12px] text-[#7a7a7a] mt-0.5">Make sure to configure the corresponding API keys in your .env file for providers to work.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
