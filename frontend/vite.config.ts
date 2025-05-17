import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API requests ke backend server saat development
    // Ini tidak diperlukan jika VITE_API_BASE_URL diset lengkap
    // Namun, ini adalah cara yang lebih umum untuk menangani API calls di dev
    proxy: {
      '/upload': { // Sesuaikan dengan endpoint backend Anda
        target: 'http://localhost:3001', // URL server backend Anda
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // Jika perlu rewrite path
      }
    }
  }
})
