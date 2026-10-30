import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/integration/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}', 'src/**/__tests__/**'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      cleanOnRerun: true,
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
