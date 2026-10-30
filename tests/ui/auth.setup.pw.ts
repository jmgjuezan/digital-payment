import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const authStatePath = path.join(process.cwd(), 'test-results', '.auth', 'user.json')

test('sign in to the local Supabase user and save browser state', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(process.env.E2E_TEST_EMAIL ?? '')
  await page.getByLabel('Password').fill(process.env.E2E_TEST_PASSWORD ?? '')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard')
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()

  await mkdir(path.dirname(authStatePath), { recursive: true })
  await page.context().storageState({ path: authStatePath })
})
