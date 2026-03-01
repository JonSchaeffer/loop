import { test, expect } from '@playwright/test'

test('redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/today')
  await expect(page).toHaveURL(/\/login/)
})

test('shows login form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})
