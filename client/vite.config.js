import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      // `@/...` -> `src/...`, matching the original Next.js project.
      '@': path.resolve(__dirname, './src'),
      // Map Next.js navigation hooks onto a History-API shim.
      'next/navigation': path.resolve(
        __dirname,
        './src/shims/next-navigation.ts'
      ),
    },
  },
})
