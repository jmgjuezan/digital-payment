import { defineConfig } from 'vitest/config'
import path from 'path'
import { loadEnv } from 'vite'

Object.assign(process.env, loadEnv('integration', process.cwd(), 'INTEGRATION_'))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.integration.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
