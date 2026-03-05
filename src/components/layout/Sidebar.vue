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
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString()
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
    class="bg-[#131313] border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col relative z-20 h-full shrink-0"
    :class="isOpen ? 'w-[280px]' : 'w-0 overflow-hidden opacity-0 border-r-0'"
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
    <div class="px-4 mt-2 flex-grow overflow-y-auto">
      <button 
        @click="emit('new-chat')"
        class="flex items-center justify-between px-4 py-3 w-full text-left text-sm text-gray-200 hover:bg-white/5 rounded-xl mb-6 transition-all ring-1 ring-white/5 hover:ring-white/10 shrink-0"
      >
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-plus"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" x2="15" y1="10" y2="10"/><line x1="12" x2="12" y1="7" y2="13"/></svg>
          <span class="font-medium text-[13px] whitespace-nowrap">Nuevo Chat</span>
        </div>
        <div class="hidden md:flex items-center gap-1 text-[10px] text-gray-500 font-mono shrink-0">
          <span>⌘</span><span>K</span>
        </div>
      </button>
      
      <!-- Grouped Conversations -->
      <template v-for="(convs, dateLabel) in groupedConversations()" :key="dateLabel">
        <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3 px-3">{{ dateLabel }}</div>
        <div class="space-y-1 mb-4">
          <button 
            v-for="conv in convs" 
            :key="conv.thread_id"
            @click="emit('select-conversation', conv.thread_id)"
            class="w-full text-left px-3 py-2.5 text-[13px] rounded-lg truncate transition-colors flex items-center gap-2"
            :class="conv.thread_id === activeThreadId 
              ? 'bg-white/10 text-white' 
              : 'text-gray-300 hover:bg-white/5 hover:text-white'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle shrink-0 text-gray-500"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
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
    <div class="p-4 mt-auto border-t border-white/5 shrink-0">
      <button 
        @click="emit('logout')"
        class="flex items-center gap-3 px-3 py-3 w-full text-left text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors"
      >
        <div class="w-8 h-8 shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
        </div>
        <div class="flex flex-col overflow-hidden">
          <span class="font-medium truncate text-gray-100">Cerrar Sesión</span>
          <span class="text-[11px] text-gray-400">Logout</span>
        </div>
      </button>
    </div>
  </aside>
</template>
