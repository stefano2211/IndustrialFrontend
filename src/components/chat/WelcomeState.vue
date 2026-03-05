<script setup lang="ts">
const emit = defineEmits<{
  (e: 'select', query: string): void
}>()

const suggestions = [
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
