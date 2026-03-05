<script setup lang="ts">
import { ref, onMounted } from 'vue'
import promptService, { type Prompt } from '@/services/promptService'

const emit = defineEmits<{
  (e: 'select', query: string): void
}>()

const suggestions = ref<any[]>([])

const defaultSuggestions = [
  {
    title: 'Show me a code snippet',
    description: "of a website's sticky header",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code text-gray-500"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    query: "Show me a code snippet of a website's sticky header"
  },
  {
    title: 'Help me study',
    description: "vocabulary for a college entrance exam",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open text-gray-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    query: "Help me study vocabulary for a college entrance exam"
  },
  {
    title: 'Analiza este documento financiero',
    description: "Sube un PDF y pide un resumen con RAG y LangGraph",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text text-gray-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
    query: "Analiza este documento financiero. Sube un PDF y pide un resumen",
    fullWidth: true
  }
]

onMounted(async () => {
  try {
    const fetchedPrompts = await promptService.listPrompts(true) // Fetch only enabled
    if (fetchedPrompts.length > 0) {
      suggestions.value = fetchedPrompts.map(p => ({
        title: p.title,
        description: p.description,
        icon: p.icon || `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles text-gray-500"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
        query: p.query,
        fullWidth: false // Could be dynamic if added to schema
      }))
    } else {
      suggestions.value = defaultSuggestions
    }
  } catch (error) {
    console.warn('Failed to fetch prompts, falling back to defaults:', error)
    suggestions.value = defaultSuggestions
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-36 overflow-y-auto w-full">
    <!-- Welcome Header -->
    <div class="flex flex-col items-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div class="w-16 h-16 bg-gradient-to-br from-white to-gray-200 text-black font-bold rounded-full flex items-center justify-center text-2xl shadow-xl shadow-white/5">OI</div>
      <h2 class="text-3xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
        How can I help you today?
      </h2>
    </div>
    
    <!-- Suggestions Grid -->
    <div class="w-full max-w-3xl mt-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div 
          v-for="(suggestion, index) in suggestions" 
          :key="index"
          @click="emit('select', suggestion.query)"
          :class="[
            'p-4 bg-[#1a1a1a] border border-white/5 rounded-2xl hover:bg-[#222] cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm',
            suggestion.fullWidth ? 'md:col-span-2' : ''
          ]"
        >
          <div class="font-medium text-[13px] text-gray-200 flex items-center justify-between">
            <span>{{ suggestion.title }}</span>
            <div v-html="suggestion.icon"></div>
          </div>
          <div class="text-xs text-gray-500 mt-1">{{ suggestion.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.delay-150 {
  animation-delay: 150ms;
}
.fill-mode-both {
  animation-fill-mode: both;
}
</style>
