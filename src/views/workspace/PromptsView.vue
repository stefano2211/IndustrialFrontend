<script setup lang="ts">
import { ref, onMounted } from 'vue'
import promptService, { type Prompt, type PromptCreate } from '@/services/promptService'

const prompts = ref<Prompt[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const isEditing = ref(false)
const currentPromptId = ref<string | null>(null)

const newPrompt = ref<PromptCreate>({
  title: '',
  description: '',
  query: '',
  icon: '',
  is_enabled: true
})

onMounted(async () => {
  await fetchPrompts()
})

async function fetchPrompts() {
  try {
    isLoading.value = true
    prompts.value = await promptService.listPrompts()
  } catch (error) {
    console.error('Error fetching prompts:', error)
  } finally {
    isLoading.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  currentPromptId.value = null
  newPrompt.value = {
    title: '',
    description: '',
    query: '',
    icon: '',
    is_enabled: true
  }
  isModalOpen.value = true
}

function openEditModal(prompt: Prompt) {
  isEditing.value = true
  currentPromptId.value = prompt.id
  newPrompt.value = {
    title: prompt.title,
    description: prompt.description || '',
    query: prompt.query,
    icon: prompt.icon || '',
    is_enabled: prompt.is_enabled
  }
  isModalOpen.value = true
}

async function savePrompt() {
  try {
    if (isEditing.value && currentPromptId.value) {
      await promptService.updatePrompt(currentPromptId.value, newPrompt.value)
    } else {
      await promptService.createPrompt(newPrompt.value)
    }
    isModalOpen.value = false
    await fetchPrompts()
  } catch (error) {
    console.error('Error saving prompt:', error)
  }
}

async function togglePrompt(prompt: Prompt) {
  try {
    await promptService.updatePrompt(prompt.id, { is_enabled: !prompt.is_enabled })
    await fetchPrompts()
  } catch (error) {
    console.error('Error toggling prompt:', error)
  }
}

async function deletePrompt(id: string) {
  if (!confirm('¿Estás seguro de eliminar este prompt?')) return
  try {
    await promptService.deletePrompt(id)
    await fetchPrompts()
  } catch (error) {
    console.error('Error deleting prompt:', error)
  }
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-semibold text-white">Prompts Predeterminados</h1>
        <p class="text-gray-400 mt-1">Gestiona las sugerencias que aparecen al iniciar un chat.</p>
      </div>
      <button 
        @click="openCreateModal"
        class="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Nuevo Prompt
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>

    <div v-else-if="prompts.length === 0" class="text-center py-20 bg-[#1a1a1a] rounded-3xl border border-white/5">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square text-gray-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <h3 class="text-lg font-medium text-white">No hay prompts aún</h3>
      <p class="text-gray-400 mt-2">Crea tu primer prompt para ayudar a los usuarios.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="prompt in prompts" 
        :key="prompt.id"
        class="p-5 bg-[#1a1a1a] rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col group"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-white/5 rounded-lg text-gray-400" v-html="prompt.icon || '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' class=\'lucide lucide-message-square\'><path d=\'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\'/></svg>'"></div>
            <h3 class="font-medium text-white">{{ prompt.title }}</h3>
          </div>
          <button 
            @click="togglePrompt(prompt)"
            :class="prompt.is_enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'"
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
          >
            {{ prompt.is_enabled ? 'Activado' : 'Desactivado' }}
          </button>
        </div>
        <p class="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">{{ prompt.description }}</p>
        <div class="flex items-center justify-between border-t border-white/5 pt-4">
          <div class="text-[10px] text-gray-500 font-mono truncate max-w-[120px]">
            {{ prompt.query }}
          </div>
          <div class="flex items-center gap-2">
            <button @click="openEditModal(prompt)" class="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button @click="deletePrompt(prompt.id)" class="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="isModalOpen = false"></div>
      <div class="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div class="p-6 border-b border-white/5">
          <h2 class="text-xl font-semibold text-white">{{ isEditing ? 'Editar Prompt' : 'Nuevo Prompt' }}</h2>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Título</label>
            <input 
              v-model="newPrompt.title"
              type="text" 
              placeholder="Ej: Resumir documento"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-gray-600"
            >
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Descripción</label>
            <textarea 
              v-model="newPrompt.description"
              placeholder="Breve explicación de lo que hace el prompt"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-gray-600 h-20 resize-none"
            ></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Query (Pregunta al LLM)</label>
            <input 
              v-model="newPrompt.query"
              type="text" 
              placeholder="Ej: Haz un resumen detallado de este PDF"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-gray-600"
            >
          </div>
        </div>
        <div class="p-6 bg-white/[0.02] flex items-center justify-end gap-3">
          <button @click="isModalOpen = false" class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancelar</button>
          <button @click="savePrompt" class="px-6 py-2 bg-white text-black rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>
