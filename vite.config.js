import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Front-end calls /api/*; in dev they are forwarded to the Express API.
      '/api': 'http://localhost:5000',
    },
  },
})
