<script setup lang="ts">
import { inject, ref, watch, type Ref } from 'vue'
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

async function handleSendMessage(content: string) {
  // Optimistically add user message
  activeMessages.value.push({ role: 'user', content })
  isLoading.value = true
  
  try {
    const data = await chatService.sendMessage(
      content, 
      activeThreadId.value || undefined,
      activeKnowledgeBaseId.value || undefined
    )
    
    // If backend generated a new thread_id, propagate it
    const threadId = data.thread_id || activeThreadId.value || 'unknown'
    
    const assistantMsg: MessageItem = { 
      role: 'assistant', 
      content: data.answer || 'No response received.' 
    }
    
    // Add assistant message
    activeMessages.value.push(assistantMsg)
    
    // Notify parent (MainLayout) so it can refresh conversation list
    if (!activeThreadId.value) {
      activeThreadId.value = threadId
    }
    onMessageSent(threadId, { role: 'user', content }, assistantMsg)
    
  } catch (error) {
    console.error('Chat error', error)
    activeMessages.value.push({ 
      role: 'assistant', 
      content: 'I encountered an error connecting to the IndustrialBackend. Please try again.' 
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full w-full relative overflow-hidden bg-transparent">
    
    <!-- Loading messages indicator -->
    <div v-if="isLoadingMessages" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-4 text-gray-400">
        <div class="relative w-12 h-12">
          <svg class="animate-spin w-full h-full text-white/20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
          </svg>
          <svg class="absolute top-0 left-0 w-full h-full text-white animate-spin" style="animation-duration: 1.5s" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
        <span class="text-xs font-medium tracking-widest uppercase opacity-50">Sincronizando</span>
      </div>
    </div>
    
    <!-- Initial State (no messages) -->
    <WelcomeState 
      v-else-if="activeMessages.length === 0" 
      @select="handleSendMessage" 
    />
    
    <!-- Active Chat State -->
    <div v-else class="flex-1 overflow-y-auto px-4 md:px-6 pt-10 pb-44 w-full max-w-4xl mx-auto space-y-6 scroll-smooth no-scrollbar">
      <div 
        v-for="(msg, idx) in activeMessages" 
        :key="idx"
        class="flex gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500"
        :class="msg.role === 'user' ? 'flex-row-reverse' : 'justify-start'"
      >
        <!-- Avatar -->
        <div class="shrink-0 mt-1">
          <div v-if="msg.role === 'assistant'" class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px] shadow-sm">
            OI
          </div>
          <div v-else class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
            U
          </div>
        </div>
        
        <!-- Message Content -->
        <div 
          class="flex flex-col max-w-[80%]"
          :class="msg.role === 'user' ? 'items-end' : 'items-start'"
        >
          <div 
            class="px-5 py-3.5 rounded-2xl text-[15px] leading-[1.7] transition-all"
            :class="msg.role === 'user' 
              ? 'bg-[#2f2f2f] text-[#ececec] rounded-tr-sm border border-white/5' 
              : 'bg-transparent text-[#ececec] rounded-tl-sm'"
          >
            <div class="whitespace-pre-wrap">{{ msg.content }}</div>
          </div>
          <span class="text-[10px] mt-1.5 text-[#7a7a7a] font-medium mx-1">
            {{ msg.role === 'user' ? '' : 'Aura AI' }}
          </span>
        </div>
      </div>
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="flex gap-4 w-full justify-start animate-in fade-in duration-300">
        <div class="shrink-0 mt-1">
          <div class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px] shadow-sm">
            OI
          </div>
        </div>
        <div class="px-5 py-4 flex items-center gap-1.5">
          <div class="w-2 h-2 bg-[#7a7a7a] rounded-full animate-bounce [animation-duration:0.8s]"></div>
          <div class="w-2 h-2 bg-[#7a7a7a] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
          <div class="w-2 h-2 bg-[#7a7a7a] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
        </div>
      </div>
    </div>

    <!-- Persistent Input -->
    <ChatInput @send="handleSendMessage" :disabled="isLoading" />
  </div>
</template>

<style>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
