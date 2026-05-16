import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // In local dev, proxy /api calls straight to the backend container
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
      },
    },
  },
})
