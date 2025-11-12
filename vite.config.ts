import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ВАЖНО: укажи имя репозитория после слеша
export default defineConfig({
  plugins: [react()],
  base: '/skillhunter-site/',   // ← имя твоего репозитория
})
