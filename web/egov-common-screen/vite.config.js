import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost', // Or '0.0.0.0' for access from other devices
    port: 3000,        // Default Vite port
  },
})
