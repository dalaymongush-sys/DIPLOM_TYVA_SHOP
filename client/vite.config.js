import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'gleaming-success-production.up.railway.app',
      'tuvashop.ru',
      'www.tuvashop.ru',
    ],
    host: '0.0.0.0',
    port: process.env.PORT || 4173,
  },
  server: {
    host: '0.0.0.0',
  }
})
