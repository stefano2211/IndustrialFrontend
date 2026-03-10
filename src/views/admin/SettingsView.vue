<script setup lang="ts">
import { ref, computed } from 'vue'
import SettingsGeneral from '@/components/admin/settings/SettingsGeneral.vue'
import SettingsDocuments from '@/components/admin/settings/SettingsDocuments.vue'
import SettingsWebSearch from '@/components/admin/settings/SettingsWebSearch.vue'

const tabs = [
  { id: 'general', label: 'General', icon: 'settings', component: SettingsGeneral },
  { id: 'documents', label: 'Documents', icon: 'file', component: SettingsDocuments },
  { id: 'web-search', label: 'Web Search', icon: 'globe', component: SettingsWebSearch },
]

const activeTabId = ref('general')

const activeTab = computed(() => tabs.find(t => t.id === activeTabId.value) || tabs[0])
</script>

<template>
  <div class="px-6 py-6 h-full flex flex-col max-w-[1200px] mx-auto overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 flex items-center gap-2 mb-6 text-xl font-semibold text-white">
      Settings
    </div>

    <!-- Layout -->
    <div class="flex-1 flex gap-8 overflow-hidden">
      <!-- Sidebar -->
      <div class="w-56 shrink-0 overflow-y-auto no-scrollbar space-y-0.5 pr-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTabId = tab.id"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer text-left"
          :class="activeTabId === tab.id 
            ? 'bg-[#2f2f2f] text-white' 
            : 'text-[#ececec] hover:bg-white/5'"
        >
          <!-- Icons -->
          <svg v-if="tab.icon === 'settings'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg v-else-if="tab.icon === 'file'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          <svg v-else-if="tab.icon === 'globe'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>

          {{ tab.label }}
        </button>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-y-auto pr-6 no-scrollbar pb-10">
        <h3 class="text-xl font-semibold text-white mb-6">{{ activeTab?.label }}</h3>
        
        <component 
          v-if="activeTab"
          :is="activeTab.component" 
        />
      </div>
    </div>
  </div>
</template>
