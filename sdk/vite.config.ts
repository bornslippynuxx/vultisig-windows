import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ exclude: ['fs'] }),
    wasm(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist'
    })
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        ui: 'src/ui/index.ts'
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (format === 'es') return `${entryName}.mjs`
        return `${entryName}.js`
      }
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom'
      ],
      onwarn: () => {},
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'crypto-browserify', 'stream-browserify']
  }
})