<template>
  <div class="flex flex-col h-full text-gray-200">
    <!-- Header tabs -->
    <header class="flex items-center gap-6 px-6 pt-2 pb-0 border-b border-white/5 sticky top-0 bg-[#212121] z-10 w-full shrink-0">
      <h1 class="text-xl font-semibold mr-4 text-white pb-3">Workspace</h1>
      
      <nav class="flex gap-6">
        <router-link
          to="/workspace/knowledge"
          class="text-[15px] font-medium text-gray-400 pb-3 -mb-[1px] border-b-2 border-transparent hover:text-gray-200 transition-colors"
          active-class="!text-white border-white"
        >
          Conocimiento
        </router-link>
        <router-link
          to="/workspace/prompts"
          class="text-[15px] font-medium text-gray-400 pb-3 -mb-[1px] border-b-2 border-transparent hover:text-gray-200 transition-colors"
          active-class="!text-white border-white"
        >
          Prompts
        </router-link>
        <router-link
          to="/workspace/models"
          class="text-[15px] font-medium text-gray-400 pb-3 -mb-[1px] border-b-2 border-transparent hover:text-gray-200 transition-colors"
          active-class="!text-white border-white"
        >
          Modelos
        </router-link>
      </nav>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto w-full p-8 max-w-[1200px] mx-auto">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
// Top level layout for the workspace view section
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
