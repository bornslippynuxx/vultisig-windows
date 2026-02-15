import path from 'path'
import { defineConfig, type Plugin, PluginOption } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

import { getCommonPlugins } from '../../core/ui/vite/plugins'
import { getStaticCopyTargets } from '../../core/ui/vite/staticCopy'

// Resolve @vultisig/sdk to the chrome-extension platform build.
// This uses chrome.storage.local and Web Crypto instead of browser defaults.
// Excluded from the inpage build — SDK is too heavy for the injected script.
const sdkAlias = {
  '@vultisig/sdk': path.resolve(
    __dirname,
    '../../../vultisig-sdk/packages/sdk/dist/index.chrome-extension.js'
  ),
}

// Resolves the conflict between vite-plugin-node-polyfills shims and the SDK's
// pre-built dist (which marks buffer/crypto as external). Without this plugin,
// Rollup errors with "resolved as a module now, but it was an external module before".
// Adapted from the SDK's browser example (examples/browser/vite.config.ts).
function resolvePolyfillShims(): Plugin {
  return {
    name: 'resolve-polyfill-shims',
    resolveId(id) {
      if (id === 'vite-plugin-node-polyfills/shims/buffer')
        return { id: '\0polyfill-buffer', external: false }
      if (id === 'vite-plugin-node-polyfills/shims/process')
        return { id: '\0polyfill-process', external: false }
      if (id === 'vite-plugin-node-polyfills/shims/global')
        return { id: '\0polyfill-global', external: false }
      return null
    },
    load(id) {
      if (id === '\0polyfill-buffer')
        return 'import { Buffer } from "buffer"; export { Buffer }; export default Buffer;'
      if (id === '\0polyfill-process')
        return 'import process from "process/browser"; export { process }; export default process;'
      if (id === '\0polyfill-global') return 'export default globalThis;'
      return null
    },
  }
}



export default async () => {
  const chunk = process.env.CHUNK

  if (chunk) {
    let format: 'cjs' | 'es' | 'iife' | 'umd' | undefined = undefined
    let plugins: PluginOption[] = []

    switch (chunk) {
      case 'background':
        plugins = [
          nodePolyfills({ exclude: ['fs'] }),
          resolvePolyfillShims(),
          wasm(),
          topLevelAwait(),
        ]
        break
      case 'inpage':
        format = 'iife'
        plugins = [
          nodePolyfills({
            exclude: ['fs'],
            protocolImports: true,
          }),
        ]
        break
      default:
        break
    }

    return defineConfig({
      plugins,
      resolve: chunk !== 'inpage' ? { alias: sdkAlias } : undefined,
      build: {
        copyPublicDir: false,
        emptyOutDir: false,
        manifest: false,
        rollupOptions: {
          input: {
            [chunk]: path.resolve(__dirname, `src/${chunk}/index.ts`),
          },
          onwarn: () => {},
          output: {
            assetFileNames: 'assets/[name].[ext]',
            chunkFileNames: 'assets/[name].js',
            entryFileNames: '[name].js',
            format,
          },
        },
      },
    })
  } else {
    return defineConfig({
      plugins: [
        ...getCommonPlugins(),
        resolvePolyfillShims(),
        viteStaticCopy({
          targets: getStaticCopyTargets(),
        }),
      ],
      resolve: { alias: sdkAlias },
      build: {
        emptyOutDir: false,
        manifest: false,
        rollupOptions: {
          input: {
            index: path.resolve(__dirname, 'index.html'),
            popup: path.resolve(__dirname, 'popup.html'),
          },
          onwarn: () => {},
          output: {
            assetFileNames: 'assets/[name].[ext]',
            chunkFileNames: 'assets/[name].js',
            entryFileNames: '[name].js',
          },
        },
      },
    })
  }
}
