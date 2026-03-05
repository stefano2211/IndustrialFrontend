<script setup lang="ts">
import type { Conversation } from '@/services/conversationService'

const props = defineProps<{
  isOpen: boolean
  conversations: Conversation[]
  activeThreadId: string | null
}>()

const emit = defineEmits<{
  (e: 'new-chat'): void
  (e: 'select-conversation', threadId: string): void
  (e: 'logout'): void
}>()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  
  // Normalize both dates to midnight to calculate pure day differences
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  const diffMs = todayMidnight.getTime() - dateMidnight.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Group conversations by date
function groupedConversations() {
  const groups: Record<string, Conversation[]> = {}
  for (const conv of props.conversations) {
    const label = formatDate(conv.updated_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(conv)
  }
  return groups
}
</script>

<template>
  <aside 
    class="bg-transparent transition-all duration-300 ease-in-out flex flex-col relative z-20 h-full shrink-0"
    :class="isOpen ? 'w-[260px]' : 'w-0 overflow-hidden opacity-0'"
  >
    <!-- Logo & Title -->
    <div class="p-4 flex items-center justify-between">
      <div class="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer w-full text-sm font-medium transition-all group">
        <div class="w-8 h-8 bg-gradient-to-tr from-gray-200 to-white text-black font-bold rounded-lg flex items-center justify-center text-xs shadow-sm">
          OI
        </div>
        <span class="tracking-wide text-gray-100 whitespace-nowrap">Open WebUI</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right ml-auto text-gray-500 group-hover:translate-x-0.5 transition-transform shrink-0"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>

    <!-- Scrollable Chat List -->
    <div class="px-3 mt-2 flex-grow overflow-y-auto no-scrollbar">
      
      <!-- Main Actions -->
      <div class="mb-6 space-y-0.5 mt-2">
        <button 
          @click="emit('new-chat')"
          class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-[14px] font-medium text-gray-200 hover:bg-white/5 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen shrink-0 text-gray-400"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Nuevo Chat
        </button>

        <button 
          class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-[14px] font-medium text-gray-200 hover:bg-white/5 rounded-xl transition-colors opacity-70 cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search shrink-0 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Búsqueda
        </button>

        <button 
          class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-[14px] font-medium text-gray-200 hover:bg-white/5 rounded-xl transition-colors opacity-70 cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text shrink-0 text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          Notas
        </button>

        <router-link
          to="/workspace"
          class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-[14px] font-medium text-gray-200 hover:bg-white/5 rounded-xl transition-colors group"
          active-class="bg-white/5 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid shrink-0 text-gray-400"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          Workspace
        </router-link>
      </div>
      
      <!-- Grouped Conversations -->
      <template v-for="(convs, dateLabel) in groupedConversations()" :key="dateLabel">
        <div class="text-[14px] font-medium text-gray-400 mb-2 px-3 mt-6">{{ dateLabel }}</div>
        <div class="space-y-0.5 mb-2">
          <button 
            v-for="conv in convs" 
            :key="conv.thread_id"
            @click="emit('select-conversation', conv.thread_id)"
            class="w-full text-left px-3 py-2 text-[14px] rounded-xl truncate transition-colors flex items-center gap-3"
            :class="conv.thread_id === activeThreadId 
              ? 'bg-white/5 text-gray-200 font-medium' 
              : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'"
          >
            <span class="truncate">{{ conv.title }}</span>
          </button>
        </div>
      </template>
      
      <!-- Empty state -->
      <div v-if="conversations.length === 0" class="text-center text-gray-500 text-xs mt-8 px-4">
        No hay conversaciones aún. ¡Crea una nueva!
      </div>
    </div>

    <!-- User Profile Footer -->
    <div class="p-3 mt-auto shrink-0 mb-2">
      <button 
        @click="emit('logout')"
        class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors"
      >
        <div class="w-7 h-7 shrink-0 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-[11px] font-bold text-gray-300">
          U
        </div>
        <div class="flex flex-col overflow-hidden">
          <span class="font-medium truncate text-[14px]">Cerrar Sesión</span>
        </div>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
