import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const supabaseUrl = process.env.E2E_SUPABASE_URL
const supabaseKey = process.env.E2E_SUPABASE_PUBLISHABLE_KEY
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Run scripts/test-performance.ps1 to start local Supabase and configure the performance test environment.')
}

if (!['localhost', '127.0.0.1'].includes(new URL(supabaseUrl).hostname)) {
  throw new Error('Performance tests only run against a local Docker Supabase instance.')
}

const baseURL = 'http://127.0.0.1:3200'
const authStatePath = path.join(process.cwd(), 'test-results', '.auth', 'user.json')

export default defineConfig({
  testDir: './tests/ui',
  testMatch: '**/*.perf.pw.ts',
  fullyParallel: false,
  workers: 1,
  globalSetup: './tests/ui/global-setup.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  outputDir: 'test-results/performance',
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.pw.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'performance-desktop',
      dependencies: ['setup'],
      testIgnore: '**/auth.setup.pw.ts',
      use: { ...devices['Desktop Chrome'], storageState: authStatePath },
    },
    {
      name: 'performance-mobile',
      dependencies: ['setup'],
      testIgnore: '**/auth.setup.pw.ts',
      use: { ...devices['Pixel 7'], storageState: authStatePath },
    },
  ],
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3200',
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
