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
    host: true,
    origin: 'http://localhost:5173', // exposed node container address
    hmr: {
      host: "localhost",
      protocol: "ws",
  },
    port: 5173,
    proxy: {
        '/api': {
            target: 'http://backend:8080'
        },
        '/ws': {
          target: 'ws://backend:8080/',
          ws: true,
        }
    },
  },
})
