import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/React-wtg-monitoring-ui-new/',
  plugins: [react()],
  server: {
    port: 6900,
  },
})
