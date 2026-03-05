<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import { conversationService, type Conversation, type MessageItem } from '@/services/conversationService'

const router = useRouter()
const isSidebarOpen = ref(true)

// Conversation state
const conversations = ref<Conversation[]>([])
const activeThreadId = ref<string | null>(null)
const activeMessages = ref<MessageItem[]>([])
const isLoadingMessages = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Load conversations from backend
async function loadConversations() {
  try {
    conversations.value = await conversationService.list()
  } catch (error) {
    console.error('Failed to load conversations', error)
  }
}

// Create a new chat
async function handleNewChat() {
  activeThreadId.value = null
  activeMessages.value = []
}

// Select an existing conversation
async function handleSelectConversation(threadId: string) {
  activeThreadId.value = threadId
  isLoadingMessages.value = true
  try {
    activeMessages.value = await conversationService.getMessages(threadId)
  } catch (error) {
    console.error('Failed to load messages', error)
    activeMessages.value = []
  } finally {
    isLoadingMessages.value = false
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('token')
  router.push('/login')
}

// Called by ChatView after sending a message — only refresh sidebar
function handleMessageSent(threadId: string, _userMsg: MessageItem, _assistantMsg: MessageItem) {
  // If this was a new chat (no activeThreadId), set it now
  if (!activeThreadId.value) {
    activeThreadId.value = threadId
  }
  // Refresh conversation list to pick up newly created or updated conversations
  loadConversations()
}

// Provide state to child components
provide('activeThreadId', activeThreadId)
provide('activeMessages', activeMessages)
provide('isLoadingMessages', isLoadingMessages)
provide('onMessageSent', handleMessageSent)

onMounted(() => {
  loadConversations()
})
</script>

<template>
  <div class="flex h-screen w-full bg-gray-950 overflow-hidden">
    <Sidebar 
      :is-open="isSidebarOpen" 
      :conversations="conversations"
      :active-thread-id="activeThreadId"
      @new-chat="handleNewChat"
      @select-conversation="handleSelectConversation"
      @logout="handleLogout"
    />

    <!-- Main Content Area Wrapper -->
    <main class="flex-1 flex flex-col relative bg-gray-950/50 min-w-0">
      <!-- Top header for mobile/toggling -->
      <header class="h-16 shrink-0 flex items-center px-4 sticky top-0 w-full z-10 bg-gradient-to-b from-gray-950 via-gray-950/80 to-transparent pointer-events-none">
        <div class="pointer-events-auto flex items-center h-full pt-2">
          <button 
            @click="toggleSidebar" 
            class="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all shadow-sm"
            aria-label="Toggle Sidebar"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
          </button>
          
          <!-- Context/Model selector placeholder -->
          <slot name="header">
            <div class="ml-4 flex items-center gap-2 text-[20px] font-semibold cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-xl transition-colors group">
              gpt-4.1-nano
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-gray-500 group-hover:text-gray-300 mt-1"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </slot>
        </div>
      </header>
      
      <!-- Injected Child Route Content -->
      <div class="flex-1 overflow-hidden relative">
        <RouterView />
      </div>
    </main>
  </div>
</template>
