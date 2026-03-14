<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Conversation } from '@/services/conversationService'

const router = useRouter()

const showProfileMenu = ref(false)

const props = defineProps<{
  isOpen: boolean
  conversations: Conversation[]
  activeThreadId: string | null
  userName: string
}>()

const emit = defineEmits<{
  (e: 'new-chat'): void
  (e: 'select-conversation', threadId: string): void
  (e: 'archive-conversation', threadId: string): void
  (e: 'archive-action'): void
  (e: 'logout'): void
}>()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  const diffMs = todayMidnight.getTime() - dateMidnight.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupedConversations() {
  const groups: Record<string, Conversation[]> = {}
  for (const conv of props.conversations) {
    const label = formatDate(conv.updated_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(conv)
  }
  return groups
}

function getInitials(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name[0] ? name[0].toUpperCase() : 'U'
}
</script>

<template>
  <aside 
    class="bg-[#171717] transition-all duration-300 ease-in-out flex flex-col relative z-20 h-full shrink-0"
    :class="isOpen ? 'w-[260px]' : 'w-0 overflow-hidden opacity-0'"
  >
    <!-- Logo & Title -->
    <div class="p-4 flex items-center justify-between">
      <div @click="emit('new-chat')" class="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer w-full text-sm font-medium transition-all group">
        <div class="w-8 h-8 bg-white text-black font-bold rounded-lg flex items-center justify-center text-xs shadow-sm">
          {{ getInitials(userName) }}
        </div>
        <span class="tracking-wide text-white whitespace-nowrap">Aura AI</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-auto text-[#7a7a7a] group-hover:translate-x-0.5 transition-transform shrink-0"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>

    <!-- Scrollable Chat List -->
    <div class="px-3 mt-1 flex-grow overflow-y-auto custom-sidebar-scroll">
      
      <!-- Main Actions -->
      <div class="mb-4 space-y-0.5 mt-1">
        <button 
          @click="emit('new-chat')"
          class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-[14px] font-medium text-[#ececec] hover:bg-white/5 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-[#b4b4b4]"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          New Chat
        </button>

        <button 
          class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-[14px] font-medium text-[#b4b4b4] hover:bg-white/5 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-[#b4b4b4]"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Search
        </button>

        <button 
          class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-[14px] font-medium text-[#b4b4b4] hover:bg-white/5 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-[#b4b4b4]"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          Notes
        </button>

        <router-link
          to="/workspace"
          class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-[14px] font-medium text-[#b4b4b4] hover:bg-white/5 rounded-xl transition-colors group"
          active-class="bg-white/5 !text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-[#b4b4b4]"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          Workspace
        </router-link>
      </div>
      
      <!-- Grouped Conversations -->
      <template v-for="(convs, dateLabel) in groupedConversations()" :key="dateLabel">
        <div class="text-[12px] font-medium text-[#7a7a7a] mb-1.5 px-3 mt-6 uppercase tracking-wide">{{ dateLabel }}</div>
        <div class="space-y-0.5 mb-2">
          <div 
            v-for="conv in convs" 
            :key="conv.thread_id"
            @click="emit('select-conversation', conv.thread_id)"
            class="group w-full text-left px-3 py-2 text-[14px] rounded-xl truncate transition-colors flex items-center gap-3 cursor-pointer"
            :class="conv.thread_id === activeThreadId 
              ? 'bg-white/[0.08] text-[#ececec] font-medium' 
              : 'text-[#b4b4b4] hover:bg-white/[0.04] hover:text-[#ececec]'"
          >
            <span class="truncate flex-1">{{ conv.title }}</span>
            <button 
              @click.stop="emit('archive-conversation', conv.thread_id)"
              class="shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg transition-all text-[#7a7a7a] hover:text-white"
              title="Archive"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
            </button>
          </div>
        </div>
      </template>
      
      <!-- Empty state -->
      <div v-if="conversations.length === 0" class="text-center text-[#7a7a7a] text-xs mt-8 px-4">
        No conversations yet. Start a new chat!
      </div>
    </div>

    <!-- User Profile Footer -->
    <div class="p-3 mt-auto shrink-0 mb-1 relative">
      <!-- Profile popup menu -->
      <Transition name="popup">
        <div 
          v-if="showProfileMenu" 
          class="absolute bottom-full left-3 right-3 mb-2 bg-[#2f2f2f] rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden z-30"
        >
          <!-- User info header -->
          <div class="px-4 py-3 border-b border-white/[0.06]">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 shrink-0 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div class="text-[14px] font-semibold text-white">{{ userName || 'User' }}</div>
                <div class="flex items-center gap-1.5 text-[12px] text-green-400">
                  <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
          </div>
          
          <!-- Menu items -->
          <div class="py-1.5">
            <button 
              @click="showProfileMenu = false; router.push('/admin/settings')"
              class="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#ececec] hover:bg-white/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Settings
            </button>
            <button 
              @click="showProfileMenu = false; $emit('archive-action')"
              class="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#ececec] hover:bg-white/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
              Archived Chats
            </button>
          </div>

          <!-- Divider + Sign Out -->
          <div class="border-t border-white/[0.06] py-1.5">
            <button 
              @click="showProfileMenu = false; emit('logout')"
              class="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#ececec] hover:bg-white/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </div>
      </Transition>

      <!-- Profile button trigger -->
      <button 
        @click="showProfileMenu = !showProfileMenu"
        class="flex items-center gap-3 px-3 py-2.5 w-full text-left text-sm text-[#ececec] hover:bg-white/5 rounded-xl transition-colors"
      >
        <div class="w-8 h-8 shrink-0 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center text-[12px] font-bold text-white shadow-sm">
          {{ getInitials(userName) }}
        </div>
        <div class="flex flex-col overflow-hidden">
          <span class="font-medium truncate text-[14px]">{{ userName || 'User' }}</span>
        </div>
      </button>
    </div>
  </aside>

  <!-- Click outside to close profile menu -->
  <Teleport to="body">
    <div v-if="showProfileMenu" class="fixed inset-0 z-10" @click="showProfileMenu = false"></div>
  </Teleport>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.popup-enter-active { transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
.popup-leave-active { transition: all 0.1s ease-in; }
.popup-enter-from, .popup-leave-to { opacity: 0; transform: translateY(8px) scale(0.95); }
</style>
