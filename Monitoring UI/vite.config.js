import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/React-WTG-Monitoring-UI/',
  plugins: [react()],
  server: {
    port: 6900,
  },
  build: {
    outDir: 'docs'
  }
})
