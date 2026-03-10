<script setup lang="ts">
interface ChatParams {
  system_prompt: string
  temperature: number | null
  max_tokens: number | null
  top_p: number | null
  top_k: number | null
  seed: number | null
  stop_sequence: string
}

const props = defineProps<{
  isOpen: boolean
  params: ChatParams
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function resetAll() {
  props.params.system_prompt = ''
  props.params.temperature = null
  props.params.max_tokens = null
  props.params.top_p = null
  props.params.top_k = null
  props.params.seed = null
  props.params.stop_sequence = ''
}

function formatValue(val: number | null): string {
  return val === null ? 'Default' : String(val)
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 bg-black/40 z-40" @click="emit('close')"></div>
    </Transition>

    <!-- Drawer -->
    <Transition name="slide">
      <div v-if="isOpen" class="fixed top-0 right-0 h-full w-[380px] max-w-full bg-[#171717] border-l border-white/[0.06] z-50 flex flex-col shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-white/10 text-white text-[13px] font-medium rounded-lg">Controls</span>
            <span class="text-[13px] text-[#7a7a7a] cursor-pointer hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">Overview</span>
          </div>
          <button @click="emit('close')" class="p-1.5 text-[#7a7a7a] hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          <!-- System Prompt -->
          <div class="space-y-2">
            <h3 class="text-[14px] font-semibold text-white">System Prompt</h3>
            <textarea 
              v-model="params.system_prompt"
              placeholder="Enter system prompt"
              rows="3"
              class="w-full bg-[#212121] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#7a7a7a] resize-none focus:outline-none focus:border-white/20 transition-colors"
            ></textarea>
          </div>

          <div class="border-t border-white/[0.06]"></div>

          <!-- Advanced Params -->
          <div>
            <h3 class="text-[14px] font-semibold text-white mb-4">Advanced Params</h3>
            <div class="space-y-4">
              
              <!-- Temperature -->
              <div class="flex items-center justify-between">
                <label class="text-[13px] text-[#b4b4b4]">Temperature</label>
                <div class="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" max="2" step="0.1"
                    :value="params.temperature ?? 0"
                    @input="(e) => params.temperature = parseFloat((e.target as HTMLInputElement).value)"
                    class="w-24 h-1 accent-white bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                  >
                  <button 
                    @click="params.temperature = null"
                    class="text-[12px] font-medium min-w-[55px] text-right"
                    :class="params.temperature === null ? 'text-[#7a7a7a]' : 'text-white'"
                  >
                    {{ formatValue(params.temperature) }}
                  </button>
                </div>
              </div>

              <!-- Max Tokens -->
              <div class="flex items-center justify-between">
                <label class="text-[13px] text-[#b4b4b4]">max_tokens</label>
                <input 
                  type="number" 
                  min="1" max="128000"
                  :value="params.max_tokens ?? ''"
                  @input="(e) => { const v = (e.target as HTMLInputElement).value; params.max_tokens = v ? parseInt(v) : null }"
                  placeholder="Default"
                  class="w-24 bg-transparent border border-white/[0.08] rounded-lg px-2 py-1 text-[12px] text-right text-white placeholder-[#7a7a7a] focus:outline-none focus:border-white/20"
                >
              </div>

              <!-- Top P -->
              <div class="flex items-center justify-between">
                <label class="text-[13px] text-[#b4b4b4]">top_p</label>
                <div class="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    :value="params.top_p ?? 1"
                    @input="(e) => params.top_p = parseFloat((e.target as HTMLInputElement).value)"
                    class="w-24 h-1 accent-white bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                  >
                  <button 
                    @click="params.top_p = null"
                    class="text-[12px] font-medium min-w-[55px] text-right"
                    :class="params.top_p === null ? 'text-[#7a7a7a]' : 'text-white'"
                  >
                    {{ formatValue(params.top_p) }}
                  </button>
                </div>
              </div>

              <!-- Top K -->
              <div class="flex items-center justify-between">
                <label class="text-[13px] text-[#b4b4b4]">top_k</label>
                <input 
                  type="number" 
                  min="1" max="100"
                  :value="params.top_k ?? ''"
                  @input="(e) => { const v = (e.target as HTMLInputElement).value; params.top_k = v ? parseInt(v) : null }"
                  placeholder="Default"
                  class="w-24 bg-transparent border border-white/[0.08] rounded-lg px-2 py-1 text-[12px] text-right text-white placeholder-[#7a7a7a] focus:outline-none focus:border-white/20"
                >
              </div>

              <!-- Seed -->
              <div class="flex items-center justify-between">
                <label class="text-[13px] text-[#b4b4b4]">Seed</label>
                <input 
                  type="number" 
                  min="0"
                  :value="params.seed ?? ''"
                  @input="(e) => { const v = (e.target as HTMLInputElement).value; params.seed = v ? parseInt(v) : null }"
                  placeholder="Default"
                  class="w-24 bg-transparent border border-white/[0.08] rounded-lg px-2 py-1 text-[12px] text-right text-white placeholder-[#7a7a7a] focus:outline-none focus:border-white/20"
                >
              </div>

              <!-- Stop Sequence -->
              <div class="flex items-center justify-between">
                <label class="text-[13px] text-[#b4b4b4]">Stop Sequence</label>
                <input 
                  type="text"
                  v-model="params.stop_sequence"
                  placeholder="Default"
                  class="w-24 bg-transparent border border-white/[0.08] rounded-lg px-2 py-1 text-[12px] text-right text-white placeholder-[#7a7a7a] focus:outline-none focus:border-white/20"
                >
              </div>

            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-white/[0.06]">
          <button 
            @click="resetAll"
            class="w-full text-[13px] font-medium text-[#7a7a7a] hover:text-white py-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-leave-active { transition: transform 0.2s ease-in; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
