import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts']
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'vault/index': resolve(__dirname, 'src/vault/index.ts'),
        'chains/index': resolve(__dirname, 'src/chains/index.ts'),
        'signing/index': resolve(__dirname, 'src/signing/index.ts')
      },
      formats: ['es'] // ESM only for now due to WASM top-level await
    },
    rollupOptions: {
      external: ['@trustwallet/wallet-core'],
      output: {
        globals: {
          '@trustwallet/wallet-core': 'WalletCore'
        }
      }
    },
    target: 'es2022',
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ['@trustwallet/wallet-core']
  }
})