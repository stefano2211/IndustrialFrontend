<template>
  <div class="relative min-h-full">
    <div class="space-y-8 animate-in mt-2">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[28px] font-semibold tracking-tight text-white mb-1.5">Knowledge</h2>
          <p class="text-gray-400 text-[15px]">Manage custom knowledge collections for your AI to use during chats.</p>
        </div>

        <button 
          @click="showCreateModal = true"
          class="flex items-center gap-2 bg-white text-black hover:bg-gray-200 font-medium px-4 py-2 rounded-full transition-colors shrink-0 shadow-sm text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Crear Colección
        </button>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="bg-white/5 border border-white/10 rounded-2xl h-36 animate-pulse"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredCollections.length === 0" class="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-5 rotate-3 shadow-sm border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 -rotate-3"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">No hay colecciones</h3>
        <p class="text-gray-400 text-[15px] mb-8 max-w-sm mx-auto">Comienza creando tu primera caja de conocimiento para agrupar documentos.</p>
        <button 
          @click="showCreateModal = true"
          class="text-sm font-medium border border-white/10 hover:bg-white/5 text-white px-5 py-2.5 rounded-full transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Crear Colección
        </button>
      </div>

      <!-- Collections Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <router-link
          v-for="kb in filteredCollections" 
          :key="kb.id"
          :to="{ name: 'knowledge-detail', params: { id: kb.id } }"
          class="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl p-5 transition-all cursor-pointer relative flex flex-col h-52 overflow-hidden shadow-sm hover:shadow-md"
        >
          
          <div class="flex items-start justify-between mb-4 relative z-10">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center shadow-inner ring-1 ring-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder text-white"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
            </div>
            <button @click.prevent="deleteKb(kb.id)" class="text-gray-500 hover:text-red-400 p-2 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
          
          <h3 class="font-semibold text-[16px] text-white mb-1.5 leading-tight relative z-10 truncate px-0.5">{{ kb.name }}</h3>
          <p class="text-gray-400 text-[13px] line-clamp-2 mb-4 relative z-10 flex-grow px-0.5">{{ kb.description || 'Sin descripción' }}</p>
          
          <div class="flex items-center text-[12px] text-gray-500 mt-auto relative z-10 px-0.5 font-medium">
            {{ formatDate(kb.created_at) }}
          </div>
        </router-link>
      </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div 
          class="bg-[#1f1f1f] border border-white/10 rounded-[2rem] w-full max-w-[440px] shadow-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-300"
          @click.stop
        >
          <div class="flex flex-col items-center mb-8">
            <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center mb-4 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-plus"><path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
            </div>
            <h3 class="text-[22px] font-semibold text-white tracking-tight">Crear nueva colección</h3>
            <p class="text-[14px] text-gray-400 mt-1">Agrupa tus documentos y recupéralos juntos</p>
          </div>
          
          <div class="space-y-5 mb-10">
            <div class="space-y-2">
              <label class="block text-[13.5px] font-medium text-gray-300 ml-1">Nombre</label>
              <input 
                v-model="newKb.name" 
                type="text" 
                placeholder="Ej. Regulaciones OSHA 2026"
                class="w-full bg-[#2a2a2a] border border-white/5 rounded-2xl px-5 py-4 text-white text-[15px] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-gray-500 shadow-inner"
                @keyup.enter="createKb"
                autofocus
              >
            </div>
            
            <div class="space-y-2">
              <label class="block text-[13.5px] font-medium text-gray-300 ml-1">Descripción <span class="text-gray-500 font-normal">(Opcional)</span></label>
              <textarea 
                v-model="newKb.description" 
                rows="3"
                placeholder="¿Qué tipo de documentos incluirá?"
                class="w-full bg-[#2a2a2a] border border-white/5 rounded-2xl px-5 py-4 text-white text-[15px] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-gray-500 resize-none shadow-inner"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button 
              @click="showCreateModal = false"
              class="px-6 py-3.5 text-[15px] font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              Cancelar
            </button>
            <button 
              @click="createKb"
              :disabled="!newKb.name.trim() || creating"
              class="px-8 py-3.5 text-[15px] font-medium bg-white text-black hover:bg-gray-100 active:scale-[0.98] rounded-full transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-white/10"
            >
              <svg v-if="creating" class="animate-spin -ml-1 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span v-else>Crear Colección</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { knowledgeService, type KnowledgeBase } from '@/services/knowledgeService'

const collections = ref<KnowledgeBase[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const creating = ref(false)
const searchQuery = ref('')

const newKb = ref({
  name: '',
  description: ''
})

const filteredCollections = computed(() => {
  if (!searchQuery.value) return collections.value
  const query = searchQuery.value.toLowerCase()
  return collections.value.filter(c => 
    c.name.toLowerCase().includes(query) || 
    (c.description && c.description.toLowerCase().includes(query))
  )
})

async function fetchCollections() {
  try {
    loading.value = true
    collections.value = await knowledgeService.listKnowledgeBases()
  } catch (error) {
    console.error('Failed to fetch knowledge bases:', error)
  } finally {
    loading.value = false
  }
}

async function createKb() {
  if (!newKb.value.name.trim() || creating.value) return
  
  try {
    creating.value = true
    const created = await knowledgeService.createKnowledgeBase(newKb.value.name, newKb.value.description)
    collections.value.unshift(created)
    showCreateModal.value = false
    newKb.value = { name: '', description: '' }
  } catch (error) {
    console.error('Failed to create knowledge base:', error)
    alert('Error al crear colección')
  } finally {
    creating.value = false
  }
}

async function deleteKb(id: string) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta colección? Todos sus documentos también serán eliminados de este contexto.')) return
  
  try {
    await knowledgeService.deleteKnowledgeBase(id)
    collections.value = collections.value.filter(c => c.id !== id)
  } catch (error) {
    console.error('Failed to delete kb:', error)
    alert('Error al eliminar')
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchCollections()
})
</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
