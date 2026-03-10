<template>
  <div class="flex flex-col h-full text-[#ececec]">
    <!-- Tab Navigation (like Open WebUI — tabs ARE the header) -->
    <nav class="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-white/[0.06] sticky top-0 bg-[#212121] z-10 w-full shrink-0">
      <router-link
        to="/workspace/models"
        class="text-[14px] font-medium px-4 py-2.5 -mb-[1px] border-b-2 border-transparent hover:text-white transition-colors rounded-t-lg"
        active-class="!text-white !border-white"
        :class="$route.path.startsWith('/workspace/models') ? '' : 'text-[#7a7a7a]'"
      >
        Models
      </router-link>
      <router-link
        to="/workspace/knowledge"
        class="text-[14px] font-medium px-4 py-2.5 -mb-[1px] border-b-2 border-transparent hover:text-white transition-colors rounded-t-lg"
        active-class="!text-white !border-white"
        :class="$route.path.startsWith('/workspace/knowledge') ? '' : 'text-[#7a7a7a]'"
      >
        Knowledge
      </router-link>
      <router-link
        to="/workspace/prompts"
        class="text-[14px] font-medium px-4 py-2.5 -mb-[1px] border-b-2 border-transparent hover:text-white transition-colors rounded-t-lg"
        active-class="!text-white !border-white"
        :class="$route.path.startsWith('/workspace/prompts') ? '' : 'text-[#7a7a7a]'"
      >
        Prompts
      </router-link>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto w-full">
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
