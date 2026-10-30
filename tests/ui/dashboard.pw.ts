import { expect, test } from '@playwright/test'

function getTodayInManila() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

test('dashboard date filters stop at today and filters are available', async ({ page }) => {
  const today = getTodayInManila()

  await page.goto('/dashboard')
  await expect(page.locator('#dashboard-date')).toHaveAttribute('max', today)
  await expect(page.locator('.transaction-filter-control select').nth(0)).toBeVisible()
  await expect(page.locator('.transaction-filter-control select').nth(1)).toBeVisible()

  await page.goto('/balances')
  await expect(page.getByRole('heading', { name: 'Balances' })).toBeVisible()
  await expect(page.locator('#balances-date')).toHaveAttribute('max', today)
})

test('seeded Supabase activity filters correctly and calculates the payment summary', async ({ page }) => {
  await page.goto('/dashboard')
  const filters = page.locator('.transaction-filter-control select')
  await filters.nth(0).selectOption('GCash Cash-in')
  await filters.nth(1).selectOption('CP1')
  await expect(page.locator('.dashboard-count')).toContainText('1')
  await expect(page.getByText('UI automation seed cash-in')).toBeVisible()

  await filters.nth(0).selectOption('')
  await filters.nth(1).selectOption('')
  await page.getByRole('button', { name: 'Summary by payment type' }).click()

  const total = page.getByRole('group', { name: 'Summary total' })
  await expect(total).toContainText('₱615.00')
  await expect(total).toContainText('Cash-in and load + charges − cash-out')
  await expect(total).toContainText('₱1,000.00 + ₱15.00 − ₱400.00')
})

test('balance type and device comboboxes select only listed options', async ({ page }) => {
  await page.goto('/balances/new')

  const balanceType = page.getByRole('combobox', { name: /balance type/i })
  await balanceType.fill('maya')
  await page.getByRole('option', { name: 'Maya' }).click()
  await expect(page.locator('input[type="hidden"][name="type"]')).toHaveValue('Maya')

  const device = page.getByRole('combobox', { name: 'Device' })
  await device.fill('CP8')
  await page.getByRole('option', { name: 'CP8' }).click()
  await expect(page.locator('input[type="hidden"][name="device"]')).toHaveValue('CP8')
})

test('unlisted balance type cannot be submitted', async ({ page }) => {
  await page.goto('/balances/new')

  await page.getByRole('combobox', { name: /balance type/i }).fill('Not a wallet')
  const device = page.getByRole('combobox', { name: 'Device' })
  await device.fill('CP1')
  await page.getByRole('option', { name: 'CP1' }).click()
  await page.getByLabel('Amount').fill('100')
  await page.getByRole('button', { name: 'Save balance' }).click()

  await expect(page.getByText('Select GCash or Maya from the list.')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Saving balance' })).not.toBeVisible()
})

test('dashboard content does not cause page-level horizontal overflow', async ({ page }) => {
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalOverflow).toBe(false)
})
