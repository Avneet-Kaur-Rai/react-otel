import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy OpenTelemetry requests to Jaeger to avoid CORS issues
      '/v1/traces': {
        target: 'http://localhost:4318',
        changeOrigin: true,
      }
    }
  }
})
