import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      hooks: resolve(__dirname, './src/hooks'),
      components: resolve(__dirname, './src/components'),
      tests: resolve(__dirname, './src/tests'),
      images: resolve(__dirname, './src/images'),
      audio: resolve(__dirname, './src/audio'),
      constants: resolve(__dirname, './src/constants'),
      functions: resolve(__dirname, './src/functions'),
      types: resolve(__dirname, './src/types'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
})
