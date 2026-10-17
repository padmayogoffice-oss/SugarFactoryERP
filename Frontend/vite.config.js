import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:4000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 12000,
    strictPort: true,
    allowedHosts: true,
    // Proxying keeps the browser same-origin, so no CORS setup is needed in dev.
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
    },
  },
})
