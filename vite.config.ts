import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_TARGET = env.VITE_API_URL || 'http://localhost:8000'

  return {
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
        // ── All API v1 routes ────────────────────────────────────────────
        '/api/v1': {
          target: API_TARGET,
          changeOrigin: true,
        },
        // ── Reactive Events ────────────────────────────────────────────────
        '/events': {
          target: API_TARGET,
          changeOrigin: true,
        },
        // ── Auth & Users ───────────────────────────────────────────────────
        '/auth': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/users': {
          target: API_TARGET,
          changeOrigin: true,
        },
        // ── Chat / Conversations ───────────────────────────────────────────
        '/chat': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/conversations': {
          target: API_TARGET,
          changeOrigin: true,
        },
        // ── Knowledge & Documents ──────────────────────────────────────────
        '/knowledge': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/documents': {
          target: API_TARGET,
          changeOrigin: true,
        },
        // ── Tools / MCP ────────────────────────────────────────────────────
        '/tools': {
          target: API_TARGET,
          changeOrigin: true,
        },
        // ── System / Admin / Other ─────────────────────────────────────────
        '/system': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/admin': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/prompts': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/models': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/mlops': {
          target: API_TARGET,
          changeOrigin: true,
        },
        '/db-collector': {
          target: API_TARGET,
          changeOrigin: true,
        },
      },
    },
  }
})
