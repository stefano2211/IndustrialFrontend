<script setup lang="ts">
import { ref, inject, type Ref } from 'vue'
import { documentService } from '@/services/documentService'
import type { KnowledgeBase } from '@/services/knowledgeService'

const knowledgeBases = inject<Ref<KnowledgeBase[]>>('knowledgeBases', ref([]))
const activeKnowledgeBaseId = inject<Ref<string | null>>('activeKnowledgeBaseId', ref(null))
const showKbDropdown = inject<Ref<boolean>>('showKbDropdown', ref(false))
const selectKb = inject<(id: string | null) => void>('selectKb', () => {})

const props = defineProps<{
  disabled?: boolean
}>()

const chatInput = ref('')
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadProgress = ref(0)
const uploadStatusText = ref('')
const currentPollingTaskId = ref<string | null>(null)

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
  uploadProgress.value = 5 // Starting progress
  uploadStatusText.value = 'Iniciando subida...'
  
  try {
    const data = await documentService.uploadFile(selectedFile.value)
    currentPollingTaskId.value = data.task_id
    
    // Start polling
    const finalStatus = await pollTaskStatus(data.task_id)
    
    const successMsg = `[Archivo subido: ${selectedFile.value.name}] (Listo y vectorizado)`
    emit('send', chatInput.value ? `${chatInput.value}\n\n${successMsg}` : successMsg)
    
    // Reset selection
    selectedFile.value = null
    chatInput.value = ''
    uploadProgress.value = 0
    if (fileInput.value) fileInput.value.value = ''
  } catch (error) {
    console.error('Upload failed', error)
    alert('Error al procesar o subir el archivo. Intenta de nuevo.')
    uploadProgress.value = 0
  } finally {
    isUploading.value = false
    currentPollingTaskId.value = null
  }
}

async function pollTaskStatus(taskId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const response = await documentService.getStatus(taskId)
        const status = response.status
        const metaStatus = response.info?.status || ''

        if (status === 'FAILURE') {
          clearInterval(interval)
          reject(new Error('Task failed'))
          return
        }

        if (status === 'SUCCESS' || metaStatus === 'completado') {
          uploadProgress.value = 100
          uploadStatusText.value = '¡Completado y vectorizado!'
          clearInterval(interval)
          // Add a small delay so user can see 100% completion
          setTimeout(() => resolve('SUCCESS'), 800)
          return
        }

        if (status === 'PROGRESS') {
           if (metaStatus === 'descargando') {
             uploadProgress.value = 30
             uploadStatusText.value = 'Descargando al servidor...'
           } else if (metaStatus === 'procesando') {
             uploadProgress.value = 70
             uploadStatusText.value = 'Procesando y vectorizando fracciones...'
           }
        } else if (status === 'PENDING') {
           uploadProgress.value = 15
           uploadStatusText.value = 'En cola para procesar...'
        }
      } catch (err) {
        // Just log and keep polling on transient errors
        console.error('Polling error', err)
      }
    }, 1500)
  })
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
      
      <!-- File Preview Area (Outside the input container for better visibility) -->
      <div v-if="selectedFile" class="mb-3 px-4 flex animate-in fade-in slide-in-from-bottom-2 duration-300 z-50 relative pointer-events-auto">
        <div class="bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 flex flex-col gap-3 shadow-xl w-72 ring-1 ring-white/10 relative overflow-hidden">
          <div class="flex items-start justify-between relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
              </div>
              <div class="flex flex-col overflow-hidden">
                <span class="text-[13px] font-medium text-gray-200 truncate pr-2">{{ selectedFile.name }}</span>
                <span class="text-[11px] text-gray-500 font-medium tracking-wide mt-0.5">{{ isUploading ? uploadStatusText : `${(selectedFile.size / 1024).toFixed(1)} KB` }}</span>
              </div>
            </div>
            <button v-if="!isUploading" @click="removeSelectedFile" class="shrink-0 p-1.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <!-- Progress Bar -->
          <div v-if="isUploading" class="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
            <div 
              class="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
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
          <div class="flex gap-1 items-center relative">
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

            <!-- Separator -->
            <div class="h-4 w-px bg-white/10 mx-1"></div>

            <!-- Knowledge Base Selector -->
            <div class="relative flex items-center">
              <button 
                @click="showKbDropdown = !showKbDropdown" 
                class="flex items-center gap-1.5 text-[13px] font-medium px-2 py-1 rounded-lg transition-all"
                :class="activeKnowledgeBaseId ? 'text-gray-200 bg-white/5 hover:bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                <span class="max-w-[120px] truncate">
                  {{ activeKnowledgeBaseId ? knowledgeBases.find(k => k.id === activeKnowledgeBaseId)?.name : 'Sin Contexto' }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-0.5" :class="showKbDropdown ? 'rotate-180' : ''"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              
              <div v-if="showKbDropdown" class="absolute bottom-[calc(100%+12px)] left-0 w-64 bg-[#232323] border border-white/5 rounded-2xl shadow-2xl py-2 z-50">
                <div class="px-1.5">
                  <button 
                    @click="selectKb(null)"
                    class="w-full text-left px-3 py-2 text-[14px] text-gray-300 hover:bg-white/[0.04] rounded-xl transition-colors flex items-center justify-between"
                  >
                    <span class="flex items-center gap-2 font-medium" :class="{'text-white': !activeKnowledgeBaseId}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="!activeKnowledgeBaseId ? 'text-gray-200' : 'text-gray-400'"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
                      Sin Contexto
                    </span>
                    <svg v-if="!activeKnowledgeBaseId" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 6 9 17l-5-5"/></svg>
                  </button>
                </div>
                
                <div class="h-px bg-white/5 my-2"></div>
                
                <div class="px-3 pb-2 text-[11px] text-gray-500 font-semibold tracking-wider uppercase">Tus Colecciones</div>
                
                <div class="px-1.5 max-h-[200px] overflow-y-auto no-scrollbar">
                  <button 
                    v-for="kb in knowledgeBases" :key="kb.id"
                    @click="selectKb(kb.id)"
                    class="w-full text-left px-3 py-2 text-[14px] text-gray-300 hover:bg-white/[0.04] rounded-xl transition-colors flex items-center justify-between mb-0.5"
                  >
                    <span class="flex items-center gap-2 truncate pr-2 font-medium" :class="{'text-white': activeKnowledgeBaseId === kb.id}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="activeKnowledgeBaseId === kb.id ? 'text-gray-200' : 'text-gray-400'"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                      <span class="truncate">{{ kb.name }}</span>
                    </span>
                    <svg v-if="activeKnowledgeBaseId === kb.id" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-white"><path d="M20 6 9 17l-5-5"/></svg>
                  </button>
                  <div v-if="knowledgeBases.length === 0" class="px-4 py-4 text-[13px] text-gray-500 text-center bg-black/10 mx-1.5 rounded-xl border border-white/5 my-1">
                    No hay colecciones creadas.
                  </div>
                </div>
              </div>
            </div>
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
