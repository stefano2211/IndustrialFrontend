<template>
  <div class="flex flex-col h-full bg-[#171717] text-[#ececec]">
    <!-- Tab Navigation (Clean, minimal header) -->
    <nav class="flex items-center gap-1 px-6 pt-5 pb-0 sticky top-0 bg-[#171717]/80 backdrop-blur-md z-10 w-full shrink-0 overflow-x-auto no-scrollbar">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="text-[13px] font-bold px-4 py-2.5 -mb-[1px] border-b-2 border-transparent transition-all uppercase tracking-widest"
        active-class="!text-white !border-white"
        :class="$route.path.startsWith(tab.path) ? '' : 'text-[#7a7a7a] hover:text-[#b4b4b4]'"
      >
        {{ tab.name }}
      </router-link>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-hidden w-full">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
const tabs = [
  { name: 'Models', path: '/workspace/models' },
  { name: 'Knowledge', path: '/workspace/knowledge' },
  { name: 'Prompts', path: '/workspace/prompts' },
  { name: 'Skills', path: '/workspace/skills' },
  { name: 'Tools', path: '/workspace/tools' }
]
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
