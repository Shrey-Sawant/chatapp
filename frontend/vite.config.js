import { defineConfig } from 'vite'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),],
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
  define: {
    global: 'window',
  },
})

