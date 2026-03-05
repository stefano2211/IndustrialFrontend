<script setup lang="ts">
import { ref } from 'vue'
import { documentService } from '@/services/documentService'

const props = defineProps<{
  disabled?: boolean
}>()

const chatInput = ref('')
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadProgress = ref(0)

const emit = defineEmits<{
  (e: 'send', message: string): void
}>()

function handleSend() {
  if ((!chatInput.value.trim() && !selectedFile.value) || props.disabled || isUploading.value) return
  
  if (selectedFile.value) {
    handleFileUpload()
  } else {
    emit('send', chatInput.value)
    chatInput.value = ''
  }
}

async function handleFileUpload() {
  if (!selectedFile.value) return
  
  isUploading.value = true
  try {
    const data = await documentService.uploadFile(selectedFile.value)
    const successMsg = `[Archivo subido: ${selectedFile.value.name}] (Task ID: ${data.task_id})`
    emit('send', chatInput.value ? `${chatInput.value}\n\n${successMsg}` : successMsg)
    
    // Reset selection
    selectedFile.value = null
    chatInput.value = ''
    if (fileInput.value) fileInput.value.value = ''
  } catch (error) {
    console.error('Upload failed', error)
    alert('Error al subir el archivo. Intenta de nuevo.')
  } finally {
    isUploading.value = false
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

function removeSelectedFile() {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="absolute bottom-6 left-0 right-0 px-4 md:px-8 bg-gradient-to-t from-gray-950/90 via-gray-950/50 to-transparent pt-12">
    <div class="max-w-3xl mx-auto backdrop-blur-sm">
      
      <!-- File Preview Area -->
      <div v-if="selectedFile" class="mb-3 px-2 flex animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div class="bg-white/10 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-3 shadow-xl">
          <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-medium text-gray-200 max-w-[150px] truncate">{{ selectedFile.name }}</span>
            <span class="text-[10px] text-gray-500 uppercase tracking-wider">{{ (selectedFile.size / 1024).toFixed(1) }} KB</span>
          </div>
          <button @click="removeSelectedFile" class="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>

      <div class="bg-[#1c1c1c]/95 border border-white/10 rounded-[2rem] p-3 flex flex-col shadow-2xl transition-all focus-within:ring-2 focus-within:ring-white/10 focus-within:border-white/20 group backdrop-blur-md">
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          @change="onFileSelected"
          accept=".pdf,.doc,.docx,.json"
        />
        
        <textarea 
          v-model="chatInput"
          @keydown.enter.prevent="handleSend"
          rows="1"
          placeholder="Message AI Agent..."
          class="w-full bg-transparent resize-none outline-none px-4 py-3 max-h-[200px] text-[15px] text-gray-100 placeholder-gray-500 group-focus-within:placeholder-gray-400"
          :disabled="disabled || isUploading"
        ></textarea>
        
        <div class="flex items-center justify-between px-2 pt-1">
          <div class="flex gap-1">
            <!-- Attachment Button -->
            <button 
              type="button" 
              @click="triggerFileInput"
              class="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center active:scale-95"
              title="Attach document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <button type="button" class="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </button>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Voice Input Button -->
            <button type="button" class="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </button>
            
            <!-- Send Button -->
            <button 
              type="button"
              @click="handleSend"
              class="p-2.5 bg-white text-black hover:bg-gray-100 rounded-full transition-all disabled:bg-white/20 disabled:text-gray-500 disabled:cursor-not-allowed ml-1 active:scale-90 shadow-lg shadow-white/5 flex items-center justify-center"
              :disabled="(!chatInput.trim() && !selectedFile) || disabled || isUploading"
            >
              <svg v-if="!isUploading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              <svg v-else class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div class="text-center mt-4 text-[11px] text-gray-500 tracking-wide">
        Aura AI Agent can make mistakes. Consider verifying important financial or legal information.
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeIn 0.3s ease-out forwards;
}
</style>
