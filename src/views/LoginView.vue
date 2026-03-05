<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await authService.login({
      email: email.value,
      password: password.value
    })
    
    if (data.access_token) {
      localStorage.setItem('token', data.access_token)
      router.push('/chat')
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.detail || 'Failed to login. Please check your credentials.'
    console.error('Login error', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="relative w-full max-w-md px-8 py-12 glass rounded-3xl shadow-2xl transition-all duration-300 mx-auto z-10">
    <!-- Header -->
    <div class="flex flex-col items-center mb-10">
      <div class="w-14 h-14 bg-gradient-to-br from-white to-gray-300 text-black font-bold rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg shadow-white/5 border border-white/20">
        OI
      </div>
      <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Welcome Back</h1>
      <p class="text-gray-400 text-sm mt-3 text-center tracking-wide">Sign in to your intelligent workspace</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-5">
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-gray-300 ml-1" for="email">Email</label>
        <div class="relative">
          <input 
            v-model="email"
            id="email" 
            type="email" 
            required
            class="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-gray-100 placeholder-gray-600"
            placeholder="you@example.com"
          >
        </div>
      </div>
      
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-gray-300 ml-1" for="password">Password</label>
        <input 
          v-model="password"
          id="password" 
          type="password" 
          required
          class="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-gray-100 placeholder-gray-600 tracking-widest"
          placeholder="••••••••"
        >
      </div>

      <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
        {{ errorMessage }}
      </div>
      
      <button 
        type="submit" 
        :disabled="isLoading"
        class="w-full relative group mt-8 overflow-hidden rounded-2xl disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <div class="absolute inset-0 bg-white transition-all duration-300 group-hover:scale-[1.02]"></div>
        <div class="relative flex justify-center items-center gap-2 px-4 py-3.5 text-black font-semibold text-[15px]">
          <span v-if="!isLoading">Sign In</span>
          <svg v-else class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </button>
    </form>

    <p class="mt-8 text-center text-sm text-gray-400">
      Don't have an account? 
      <RouterLink to="/register" class="text-white hover:text-blue-400 transition-colors font-medium">Create one</RouterLink>
    </p>
  </div>
</template>
