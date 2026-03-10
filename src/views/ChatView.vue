<script setup lang="ts">
import { inject, ref, watch, nextTick, type Ref } from 'vue'
import WelcomeState from '@/components/chat/WelcomeState.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import { chatService } from '@/services/chatService'
import type { MessageItem } from '@/services/conversationService'

// Injected from MainLayout
const activeThreadId = inject<Ref<string | null>>('activeThreadId', ref(null))
const activeKnowledgeBaseId = inject<Ref<string | null>>('activeKnowledgeBaseId', ref(null))
const activeMessages = inject<Ref<MessageItem[]>>('activeMessages', ref([]))
const isLoadingMessages = inject<Ref<boolean>>('isLoadingMessages', ref(false))
const onMessageSent = inject<(threadId: string, userMsg: MessageItem, assistantMsg: MessageItem) => void>('onMessageSent', () => {})

const isLoading = ref(false)
const streamingContent = ref('')
const chatContainer = ref<HTMLDivElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// Auto-scroll when messages change
watch(() => activeMessages.value.length, () => {
  scrollToBottom()
})

// Auto-scroll during streaming
watch(streamingContent, () => {
  scrollToBottom()
})

async function handleSendMessage(content: string) {
  // Add user message
  activeMessages.value.push({ role: 'user', content })
  isLoading.value = true
  streamingContent.value = ''
  scrollToBottom()

  try {
    await chatService.sendMessageStream(
      content,
      activeThreadId.value || undefined,
      activeKnowledgeBaseId.value || undefined,
      // onToken
      (token: string) => {
        streamingContent.value += token
      },
      // onMeta
      (meta: { thread_id: string }) => {
        if (!activeThreadId.value) {
          activeThreadId.value = meta.thread_id
        }
      },
      // onDone
      (fullContent: string) => {
        const assistantMsg: MessageItem = { role: 'assistant', content: fullContent }
        activeMessages.value.push(assistantMsg)
        streamingContent.value = ''
        isLoading.value = false

        const threadId = activeThreadId.value || 'unknown'
        onMessageSent(threadId, { role: 'user', content }, assistantMsg)
      },
      // onError
      (error: string) => {
        const errMsg = streamingContent.value 
          ? streamingContent.value 
          : `Error: ${error}`
        activeMessages.value.push({ role: 'assistant', content: errMsg })
        streamingContent.value = ''
        isLoading.value = false
      }
    )
  } catch (error) {
    console.error('Stream error', error)
    activeMessages.value.push({
      role: 'assistant',
      content: 'Connection error. Please try again.'
    })
    streamingContent.value = ''
    isLoading.value = false
  }
}

function copyMessage(content: string) {
  navigator.clipboard.writeText(content)
}
</script>

<template>
  <div class="flex flex-col h-full w-full relative overflow-hidden bg-transparent">
    
    <!-- Loading Messages Spinner -->
    <div v-if="isLoadingMessages" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <div class="relative w-10 h-10">
          <svg class="animate-spin w-full h-full text-white/10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
          </svg>
          <svg class="absolute top-0 left-0 w-full h-full text-white animate-spin" style="animation-duration: 1.5s" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </div>
    
    <!-- Welcome State -->
    <WelcomeState 
      v-else-if="activeMessages.length === 0 && !isLoading"
      @select="handleSendMessage" 
    />
    
    <!-- Messages -->
    <div v-else ref="chatContainer" class="flex-1 overflow-y-auto pt-6 pb-48 scroll-smooth">
      <div class="max-w-3xl mx-auto px-4 md:px-6 space-y-6">
        <div 
          v-for="(msg, idx) in activeMessages" 
          :key="idx"
        >
          <!-- User Message — right aligned bubble, no avatar -->
          <div v-if="msg.role === 'user'" class="flex justify-end mb-6">
            <div class="bg-[#2f2f2f] text-[#ececec] px-5 py-3 rounded-3xl rounded-br-lg max-w-[80%] text-[15px] leading-[1.7]">
              <div class="whitespace-pre-wrap">{{ msg.content }}</div>
            </div>
          </div>
          
          <!-- Assistant Message — full width with model header -->
          <div v-else class="mb-6">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-[9px]">
                OI
              </div>
              <span class="text-[14px] font-medium text-white">Aura AI</span>
            </div>
            <div class="pl-10">
              <div class="text-[15px] text-[#ececec] leading-[1.8] whitespace-pre-wrap">{{ msg.content }}</div>
              <!-- Action Icons -->
              <div class="flex items-center gap-0.5 mt-3 -ml-1.5">
                <button @click="copyMessage(msg.content)" class="p-1.5 text-[#7a7a7a] hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Copy">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
                <button class="p-1.5 text-[#7a7a7a] hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Like">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                </button>
                <button class="p-1.5 text-[#7a7a7a] hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Dislike">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Streaming in-progress message -->
        <div v-if="isLoading" class="mb-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-[9px]">
              OI
            </div>
            <span class="text-[14px] font-medium text-white">Aura AI</span>
          </div>
          <div class="pl-10">
            <div v-if="streamingContent" class="text-[15px] text-[#ececec] leading-[1.8] whitespace-pre-wrap">{{ streamingContent }}<span class="inline-block w-[2px] h-[18px] bg-white/60 ml-0.5 animate-pulse align-text-bottom"></span></div>
            <div v-else class="flex items-center gap-2 py-2">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 bg-[#7a7a7a] rounded-full animate-bounce [animation-duration:0.8s]"></div>
                <div class="w-2 h-2 bg-[#7a7a7a] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.15s]"></div>
                <div class="w-2 h-2 bg-[#7a7a7a] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.3s]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Input -->
    <ChatInput 
      :disabled="isLoading"
      @send="handleSendMessage"
    />
  </div>
</template>
