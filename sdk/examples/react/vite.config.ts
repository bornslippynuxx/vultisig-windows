import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [react(), wasm()],
  server: {
    port: 3000
  },
  assetsInclude: ['**/*.wasm'],
  define: {
    global: 'globalThis',
    'process.env': '{}'
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer'
    }
  },
  build: {
    rollupOptions: {
      external: [
        /^@core\//,
        /^@lib\//
      ]
    }
  },
  optimizeDeps: {
    include: ['buffer', 'crypto-browserify', 'stream-browserify', 'process']
  }
})