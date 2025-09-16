import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/content/content.tsx'),
      formats: ['iife'],
      name: 'PromptGuardContent',
      fileName: () => 'content.js'
    },
    rollupOptions: {
      output: {
        extend: true,
      },
      external: []
    },
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    sourcemap: false
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"production"',
    'process.env': '{}',
    'process.version': '"v18.0.0"',
    'process.platform': '"browser"',
    'process.browser': 'true',
    '__dirname': '"/"',
    '__filename': '"/content.js"',
    'Buffer': 'undefined',
    'setImmediate': 'setTimeout'
  }
})