<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { label: 'Users', path: '/admin/users' },
  { label: 'Analytics', path: '/admin/analytics' },
  { label: 'Settings', path: '/admin/settings' },
]
</script>

<template>
  <div class="flex-1 flex flex-col w-full h-full overflow-hidden">
    <!-- Tab Navigation -->
    <div class="shrink-0 flex items-center gap-1 px-6 pt-4 border-b border-white/[0.06]">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="px-4 py-2.5 text-[14px] font-medium transition-colors relative"
        :class="route.path === tab.path || route.path.startsWith(tab.path + '/')
          ? 'text-white'
          : 'text-[#7a7a7a] hover:text-[#b4b4b4]'"
      >
        {{ tab.label }}
        <div 
          v-if="route.path === tab.path || route.path.startsWith(tab.path + '/')" 
          class="absolute bottom-0 left-2 right-2 h-[2px] bg-white rounded-full"
        ></div>
      </router-link>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <RouterView />
    </div>
  </div>
</template>
