import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-recharts': ['recharts'],
          'vendor-utils': ['date-fns', 'lucide-react', 'zustand', 'react-hot-toast'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
