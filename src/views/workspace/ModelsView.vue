<script setup lang="ts">
import { ref, onMounted } from 'vue'
import modelService, { type ModelConfig } from '@/services/modelService'

const configs = ref<ModelConfig[]>([])
const isLoading = ref(true)
const isSaving = ref(false)

const roles = [
  { id: 'orchestrator', label: 'Orquestador (Agente Principal)' },
  { id: 'subagent', label: 'Sub-agentes (Agentes de Conocimiento)' }
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
    
    // Ensure all roles have a config object in our local state
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
    
    // Show success notification
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
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-white">Configuración de Modelos (LLM)</h1>
      <p class="text-gray-400 mt-1">Selecciona los proveedores y modelos que utilizará el sistema para cada función.</p>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>

    <div v-else class="space-y-6">
      <div 
        v-for="role in roles" 
        :key="role.id"
        class="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 shadow-sm"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-white">{{ role.label }}</h3>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Configurado</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Provider Select -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2 ml-1">Proveedor</label>
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
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer"
              >
                <option v-for="p in providers" :key="p.id" :value="p.id" class="bg-[#1a1a1a]">{{ p.label }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <!-- Model Select / Input -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2 ml-1">Modelo</label>
            <div class="relative">
              <input 
                :value="configs.find(c => c.role === role.id)?.model_name"
                @input="(e) => {
                  const target = e.target as HTMLInputElement;
                  const config = configs.find(c => c.role === role.id);
                  if (config) config.model_name = target.value;
                }"
                list="model-options"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-gray-600"
                placeholder="Escribe o selecciona un modelo"
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

        <div class="mt-8 flex items-center justify-end gap-4">
          <!-- Success Message -->
          <transition name="fade">
            <div 
              v-if="showSuccess[role.id]" 
              class="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-xl border border-green-400/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span class="text-sm font-medium">Configuración guardada</span>
            </div>
          </transition>

          <button 
            @click="saveConfig(role.id)"
            :disabled="isSaving"
            class="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            <svg v-if="isSaving" class="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isSaving ? 'Guardando...' : 'Guardar Configuración' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Info Alert -->
    <div class="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-4 items-start">
      <div class="p-2 bg-white/5 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info text-gray-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      </div>
      <div>
        <p class="text-sm font-medium text-white">Recordatorio de Credenciales</p>
        <p class="text-xs text-gray-500 mt-1">
          Asegúrate de tener las Claves API correspondientes configuradas en el entorno (archivo .env) para que los proveedores funcionen correctamente.
        </p>
      </div>
    </div>
  </div>
</template>
