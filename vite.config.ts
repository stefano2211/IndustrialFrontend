import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // ── Reactive Events ────────────────────────────────────────────────
      '/events': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // ── Auth & Users ───────────────────────────────────────────────────
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // ── Chat / Conversations ───────────────────────────────────────────
      '/chat': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/conversations': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // ── Knowledge & Documents ──────────────────────────────────────────
      '/knowledge': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/documents': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // ── Tools / MCP ────────────────────────────────────────────────────
      '/tools': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // ── System / Admin / Other ─────────────────────────────────────────
      '/system': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/prompts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/models': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/mlops': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/db-collector': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
