<template>
  <div class="p-8 max-w-5xl mx-auto relative min-h-full">
    <div class="space-y-6 animate-in">
      <!-- Section Header -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-semibold text-white">Knowledge</h2>
          <span class="text-[14px] text-[#7a7a7a] font-medium">{{ filteredCollections.length }}</span>
        </div>

        <button 
          @click="showCreateModal = true"
          class="flex items-center gap-2 bg-white text-black hover:bg-gray-200 font-medium px-4 py-2 rounded-xl transition-colors shrink-0 text-[13px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Create Collection
        </button>
      </header>

      <!-- Search -->
      <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a7a]"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search Knowledge" 
          class="w-full bg-transparent border border-white/[0.08] rounded-xl pl-11 pr-4 py-2.5 text-[14px] text-[#ececec] placeholder-[#7a7a7a] focus:outline-none focus:border-white/20 transition-colors"
        >
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="bg-white/5 border border-white/[0.06] rounded-2xl h-36 animate-pulse"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredCollections.length === 0 && !searchQuery" class="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div class="text-4xl mb-4">🤔</div>
        <h3 class="text-[16px] font-semibold text-white mb-2">No knowledge found</h3>
        <p class="text-[#7a7a7a] text-[14px] mb-6 max-w-sm">Create your first knowledge collection to group documents together.</p>
        <button 
          @click="showCreateModal = true"
          class="text-[13px] font-medium border border-white/10 hover:bg-white/5 text-white px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Create Collection
        </button>
      </div>

      <!-- Search empty -->
      <div v-else-if="filteredCollections.length === 0 && searchQuery" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="text-4xl mb-4">🤔</div>
        <h3 class="text-[16px] font-semibold text-white mb-2">No results found</h3>
        <p class="text-[#7a7a7a] text-[14px]">Try adjusting your search or filter to find what you are looking for.</p>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <router-link
          v-for="kb in filteredCollections" 
          :key="kb.id"
          :to="{ name: 'knowledge-detail', params: { id: kb.id } }"
          class="group bg-[#2f2f2f]/40 hover:bg-[#2f2f2f]/70 border border-white/[0.06] rounded-2xl p-5 transition-all cursor-pointer relative flex flex-col h-48 overflow-hidden"
        >
          <div class="flex items-start justify-between mb-4 relative z-10">
            <div class="w-10 h-10 rounded-xl bg-[#212121] flex items-center justify-center border border-white/[0.06]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#b4b4b4]"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
            </div>
            <button @click.prevent="deleteKb(kb.id)" class="text-[#7a7a7a] hover:text-red-400 p-1.5 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
          
          <h3 class="font-semibold text-[15px] text-white mb-1 leading-tight truncate">{{ kb.name }}</h3>
          <p class="text-[#7a7a7a] text-[13px] line-clamp-2 mb-4 flex-grow">{{ kb.description || 'No description' }}</p>
          
          <div class="text-[12px] text-[#7a7a7a] mt-auto font-medium">
            {{ formatDate(kb.created_at) }}
          </div>
        </router-link>
      </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in">
        <div 
          class="bg-[#2f2f2f] border border-white/10 rounded-2xl w-full max-w-[420px] shadow-2xl p-6 relative overflow-hidden"
          @click.stop
        >
          <h3 class="text-lg font-semibold text-white mb-1">Create new collection</h3>
          <p class="text-[13px] text-[#7a7a7a] mb-6">Group your documents and retrieve them together</p>
          
          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-[12px] font-medium text-[#b4b4b4] mb-1.5 ml-0.5">Name</label>
              <input 
                v-model="newKb.name" 
                type="text" 
                placeholder="e.g. OSHA Regulations 2026"
                class="w-full bg-[#212121] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] focus:outline-none focus:border-white/20 transition-all placeholder:text-[#7a7a7a]"
                @keyup.enter="createKb"
                autofocus
              >
            </div>
            
            <div>
              <label class="block text-[12px] font-medium text-[#b4b4b4] mb-1.5 ml-0.5">Description <span class="text-[#7a7a7a]">(Optional)</span></label>
              <textarea 
                v-model="newKb.description" 
                rows="3"
                placeholder="What types of documents will this include?"
                class="w-full bg-[#212121] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] focus:outline-none focus:border-white/20 transition-all placeholder:text-[#7a7a7a] resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <button 
              @click="showCreateModal = false"
              class="px-4 py-2 text-[14px] font-medium text-[#b4b4b4] hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              @click="createKb"
              :disabled="!newKb.name.trim() || creating"
              class="px-6 py-2 text-[14px] font-medium bg-white text-black hover:bg-gray-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="creating" class="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span v-else>Create</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue'
import { knowledgeService, type KnowledgeBase } from '@/services/knowledgeService'

const collections = ref<KnowledgeBase[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const creating = ref(false)
const searchQuery = ref('')
const refreshKnowledgeBases = inject<() => void>('refreshKnowledgeBases', () => {})

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
    refreshKnowledgeBases()
  } catch (error) {
    console.error('Failed to create knowledge base:', error)
    alert('Error creating collection')
  } finally {
    creating.value = false
  }
}

async function deleteKb(id: string) {
  if (!confirm('Are you sure you want to delete this collection? All its documents will also be removed.')) return
  
  try {
    await knowledgeService.deleteKnowledgeBase(id)
    collections.value = collections.value.filter(c => c.id !== id)
    refreshKnowledgeBases()
  } catch (error) {
    console.error('Failed to delete kb:', error)
    alert('Error deleting collection')
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
