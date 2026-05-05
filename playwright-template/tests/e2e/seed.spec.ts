import { test, expect } from '@playwright/test'

test.describe('seed', () => {
  test('app responds at baseURL', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBeTruthy()
  })

  test('html document loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
  })
})
