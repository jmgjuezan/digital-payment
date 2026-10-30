import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const supabaseUrl = process.env.E2E_SUPABASE_URL
const supabaseKey = process.env.E2E_SUPABASE_PUBLISHABLE_KEY
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Run scripts/test-ui.ps1 to start local Supabase and configure the UI test environment.')
}

if (!['localhost', '127.0.0.1'].includes(new URL(supabaseUrl).hostname)) {
  throw new Error('UI automation only runs against a local Docker Supabase instance.')
}

const baseURL = 'http://127.0.0.1:3100'
const authStatePath = path.join(process.cwd(), 'test-results', '.auth', 'user.json')

export default defineConfig({
  testDir: './tests/ui',
  testMatch: '**/*.pw.ts',
  fullyParallel: true,
  workers: 2,
  globalSetup: './tests/ui/global-setup.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.pw.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-chromium',
      dependencies: ['setup'],
      testIgnore: '**/auth.setup.pw.ts',
      use: { ...devices['Desktop Chrome'], storageState: authStatePath },
    },
    {
      name: 'mobile-chromium',
      dependencies: ['setup'],
      testIgnore: '**/auth.setup.pw.ts',
      use: { ...devices['Pixel 7'], storageState: authStatePath },
    },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
