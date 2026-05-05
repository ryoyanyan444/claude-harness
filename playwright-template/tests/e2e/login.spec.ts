import { test, expect } from '@playwright/test'

// Sample test generated from specs/login.spec.md
// Replace selectors and assertions to match your actual app.

test.describe('login flow', () => {
  test('S1: valid credentials redirect to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('valid-password')
    await page.getByRole('button', { name: /log ?in|submit|sign ?in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('S2: invalid password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('wrong-password')
    await page.getByRole('button', { name: /log ?in|submit|sign ?in/i }).click()

    await expect(page.getByText(/invalid credentials|wrong/i)).toBeVisible()
  })

  test('S3: empty submit shows validation', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /log ?in|submit|sign ?in/i }).click()

    const emailField = page.getByLabel(/email/i)
    await expect(emailField).toHaveAttribute('aria-invalid', 'true').catch(async () => {
      await expect(page.getByText(/required|empty/i).first()).toBeVisible()
    })
  })
})
