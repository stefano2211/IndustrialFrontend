<script setup lang="ts">
import { ref, onMounted, provide, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import ChatControls from '@/components/chat/ChatControls.vue'
import { conversationService, type Conversation, type MessageItem } from '@/services/conversationService'
import { knowledgeService, type KnowledgeBase } from '@/services/knowledgeService'
import modelService from '@/services/modelService'
import api from '@/services/api'

const router = useRouter()
const isSidebarOpen = ref(true)
const isControlsOpen = ref(false)

// User state
const userName = ref('')

// Model state
const orchestratorModel = ref('Cargando...')

// Chat params (controlled by ChatControls drawer)
const chatParams = reactive({
  system_prompt: '',
  temperature: null as number | null,
  max_tokens: null as number | null,
  top_p: null as number | null,
  top_k: null as number | null,
  seed: null as number | null,
  stop_sequence: ''
})

// Conversation state
const conversations = ref<Conversation[]>([])
const activeThreadId = ref<string | null>(null)
const activeMessages = ref<MessageItem[]>([])
const isLoadingMessages = ref(false)

// Knowledge bases 
const knowledgeBases = ref<KnowledgeBase[]>([])
const activeKnowledgeBaseId = ref<string | null>(null)
const showKbDropdown = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Load user info
async function loadUserInfo() {
  try {
    const response = await api.get('/users/me')
    userName.value = response.data.username || response.data.email?.split('@')[0] || 'User'
  } catch (error) {
    console.error('Failed to load user info', error)
    userName.value = 'User'
  }
}

// Load model info
async function loadModelInfo() {
  try {
    const configs = await modelService.listConfigs()
    const orchestrator = configs.find(c => c.role === 'orchestrator')
    if (orchestrator) {
      orchestratorModel.value = orchestrator.model_name
    } else {
      orchestratorModel.value = 'gpt-4o'
    }
  } catch (error) {
    console.error('Failed to load model info', error)
    orchestratorModel.value = 'Error'
  }
}

// Load conversations from backend
async function loadConversations() {
  try {
    conversations.value = await conversationService.list()
  } catch (error) {
    console.error('Failed to load conversations', error)
  }
}

async function loadKnowledgeBases() {
  try {
    knowledgeBases.value = await knowledgeService.listKnowledgeBases()
  } catch (error) {
    console.error('Failed to load knowledge bases', error)
  }
}

function selectKb(id: string | null) {
  activeKnowledgeBaseId.value = id
  showKbDropdown.value = false
}

// Create a new chat
async function handleNewChat() {
  activeThreadId.value = null
  activeMessages.value = []
  if (router.currentRoute.value.path !== '/chat') {
    router.push('/chat')
  }
}

// Select an existing conversation
async function handleSelectConversation(threadId: string) {
  activeThreadId.value = threadId
  isLoadingMessages.value = true
  
  if (router.currentRoute.value.path !== '/chat') {
    router.push('/chat')
  }

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

// Called by ChatView after sending a message
function handleMessageSent(threadId: string, _userMsg: MessageItem, _assistantMsg: MessageItem) {
  if (!activeThreadId.value) {
    activeThreadId.value = threadId
  }
  loadConversations()
}

// Provide state to child components
provide('activeThreadId', activeThreadId)
provide('activeMessages', activeMessages)
provide('isLoadingMessages', isLoadingMessages)
provide('onMessageSent', handleMessageSent)
provide('activeKnowledgeBaseId', activeKnowledgeBaseId)
provide('knowledgeBases', knowledgeBases)
provide('showKbDropdown', showKbDropdown)
provide('selectKb', selectKb)
provide('userName', userName)
provide('chatParams', chatParams)

onMounted(() => {
  loadUserInfo()
  loadConversations()
  loadKnowledgeBases()
  loadModelInfo()
})
</script>

<template>
  <div class="flex h-screen w-full bg-[#171717] overflow-hidden">
    <Sidebar 
      :is-open="isSidebarOpen" 
      :conversations="conversations"
      :active-thread-id="activeThreadId"
      :user-name="userName"
      @new-chat="handleNewChat"
      @select-conversation="handleSelectConversation"
      @logout="handleLogout"
    />

    <!-- Main Content Area Wrapper -->
    <main class="flex-1 flex flex-col relative bg-[#212121] min-w-0">
      <!-- Top header -->
      <header class="h-14 shrink-0 flex items-center justify-between px-4 sticky top-0 w-full z-10 bg-[#212121]">
        <!-- Left: sidebar toggle + model name -->
        <div class="pointer-events-auto flex items-center h-full">
          <button 
            @click="toggleSidebar" 
            class="p-2 hover:bg-white/5 rounded-lg text-[#b4b4b4] hover:text-white transition-all"
            aria-label="Toggle Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
          </button>
          
          <slot name="header">
            <div class="ml-3 flex items-center gap-3 relative">
              <div @click="router.push('/workspace/models')" class="flex items-center gap-2 text-lg font-medium cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-xl transition-colors group text-white">
                {{ orchestratorModel }}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#7a7a7a] group-hover:text-[#b4b4b4] mt-0.5 opacity-0 group-hover:opacity-100 transition-all"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </slot>
        </div>

        <!-- Right: controls icons -->
        <div class="flex items-center gap-1">
          <!-- Dots menu -->
          <button class="p-2 text-[#7a7a7a] hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          <!-- Controls (sliders icon) -->
          <button 
            @click="isControlsOpen = !isControlsOpen" 
            class="p-2 hover:bg-white/5 rounded-lg transition-colors"
            :class="isControlsOpen ? 'text-white bg-white/5' : 'text-[#7a7a7a] hover:text-white'"
            title="Model Controls"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>
          </button>
          <!-- User avatar -->
          <div class="w-8 h-8 rounded-full bg-[#7a7a7a]/30 flex items-center justify-center ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#b4b4b4]"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </header>
      
      <!-- Injected Child Route Content -->
      <div class="flex-1 flex flex-col w-full h-full">
        <RouterView />
      </div>
    </main>

    <!-- Controls Drawer -->
    <ChatControls 
      :is-open="isControlsOpen"
      :params="chatParams"
      @close="isControlsOpen = false"
    />
  </div>
</template>
