import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration for TinaCMS + React
 *
 * Key settings:
 * - React plugin for JSX support
 * - Port 3000 (TinaCMS default)
 * - Host 0.0.0.0 for Docker compatibility
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',  // Allows external connections (Docker, network)
  },
  build: {
    outDir: 'dist',
  },
})
