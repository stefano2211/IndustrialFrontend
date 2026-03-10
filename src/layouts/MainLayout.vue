<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import { conversationService, type Conversation, type MessageItem } from '@/services/conversationService'
import { knowledgeService, type KnowledgeBase } from '@/services/knowledgeService'
import modelService from '@/services/modelService'
import api from '@/services/api'

const router = useRouter()
const isSidebarOpen = ref(true)

// User state
const userName = ref('')

// Model state
const orchestratorModel = ref('Cargando...')

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
      <header class="h-14 shrink-0 flex items-center px-4 sticky top-0 w-full z-10 bg-[#212121]">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#7a7a7a] group-hover:text-[#b4b4b4] mt-0.5 opacity-0 group-hover:opacity-100 transition-all"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </div>
          </slot>
        </div>
      </header>
      
      <!-- Injected Child Route Content -->
      <div class="flex-1 flex flex-col w-full h-full">
        <RouterView />
      </div>
    </main>
  </div>
</template>
