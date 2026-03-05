<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from './layouts/AuthLayout.vue'
import MainLayout from './layouts/MainLayout.vue'

const route = useRoute()

// Map layout names to actual components
const layoutComponent = computed(() => {
  if (route.meta.layout === 'auth') return AuthLayout
  if (route.meta.layout === 'main') return MainLayout
  // Fallback to minimal wrapper if no layout specified
  return 'div'
})
</script>

<template>
  <component :is="layoutComponent" v-if="route.meta.layout">
    <RouterView />
  </component>
  
  <RouterView v-else />
</template>

<style>
/* Global resets handled by Tailwind */
</style>
