import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: '',
    sourcemap: true,
  },
  server: {
    hmr: {
      host: "localhost",
      protocol: "ws",
  },
    port: 5173,
    proxy: {
        '/api': {
            target: 'http://localhost:8080/',
        },
        '/ws': {
          target: 'ws://localhost:8080/',
          ws: true,
        }
    },
  },
})
