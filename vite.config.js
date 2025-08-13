import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Use relative paths so the built site can be served from any directory
  // or opened directly from the file system without a web server.
  base: './',
  plugins: [react(), tailwindcss()],
})
