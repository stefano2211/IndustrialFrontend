<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { adminService, type AdminUser } from '@/services/adminService'

const users = ref<AdminUser[]>([])
const searchQuery = ref('')
const isLoading = ref(true)

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u =>
    u.username.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  )
})

async function loadUsers() {
  isLoading.value = true
  try {
    users.value = await adminService.listUsers()
  } catch (e) {
    console.error('Failed to load users', e)
  } finally {
    isLoading.value = false
  }
}

async function toggleRole(user: AdminUser) {
  try {
    const updated = await adminService.updateUserRole(user.id, !user.is_superuser)
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = updated
  } catch (e) {
    console.error('Failed to update role', e)
  }
}

async function deleteUser(user: AdminUser) {
  if (!confirm(`Are you sure you want to delete ${user.username}?`)) return
  try {
    await adminService.deleteUser(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Failed to delete user')
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

onMounted(loadUsers)
</script>

<template>
  <div class="px-6 py-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-white">
        Users <span class="text-[#7a7a7a] font-normal text-lg ml-1">{{ users.length }}</span>
      </h2>
      <div class="flex items-center gap-3">
        <!-- Search -->
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7a7a]"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search"
            class="bg-[#2f2f2f] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-[13px] text-white placeholder-[#7a7a7a] w-56 focus:outline-none focus:border-white/20 transition-colors"
          >
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-[#2f2f2f]/50 rounded-2xl border border-white/[0.06] overflow-hidden">
      <!-- Table Header -->
      <div class="grid grid-cols-[100px_1fr_1fr_140px_140px_60px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a] border-b border-white/[0.06]">
        <div>Role</div>
        <div>Name</div>
        <div>Email</div>
        <div>Last Active</div>
        <div>Created At</div>
        <div></div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="px-5 py-12 text-center text-[#7a7a7a] text-sm">
        Loading users...
      </div>

      <!-- Rows -->
      <template v-else>
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="grid grid-cols-[100px_1fr_1fr_140px_140px_60px] gap-4 px-5 py-3 items-center border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
        >
          <!-- Role badge -->
          <div>
            <button
              @click="toggleRole(user)"
              class="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer"
              :class="user.is_superuser 
                ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-500/30' 
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'"
              :title="'Click to change role'"
            >
              {{ user.is_superuser ? 'ADMIN' : 'USER' }}
            </button>
          </div>

          <!-- Name -->
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span class="text-[14px] text-white font-medium">{{ user.username }}</span>
            <div v-if="user.is_active" class="w-2 h-2 bg-green-400 rounded-full" title="Active"></div>
          </div>

          <!-- Email -->
          <div class="text-[13px] text-[#b4b4b4] truncate">{{ user.email }}</div>

          <!-- Last Active -->
          <div class="text-[13px] text-[#7a7a7a]">{{ timeAgo(user.updated_at) }}</div>

          <!-- Created At -->
          <div class="text-[13px] text-[#7a7a7a]">{{ formatDate(user.created_at) }}</div>

          <!-- Actions -->
          <div class="flex justify-end">
            <button
              @click="deleteUser(user)"
              class="p-1.5 text-[#7a7a7a] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete user"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-if="!isLoading && filteredUsers.length === 0" class="px-5 py-12 text-center text-[#7a7a7a] text-sm">
        No users found.
      </div>
    </div>

    <!-- Hint -->
    <p class="text-[12px] text-[#7a7a7a] mt-3 text-center">
      ⓘ Click on the user role button to change a user's role.
    </p>
  </div>
</template>
