import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show sign-in button on landing page', async ({ page }) => {
    await page.goto('/')

    const signInButton = page.getByRole('button', { name: 'Sign in with Google' })
    await expect(signInButton).toBeVisible()
  })

  test('should redirect unauthenticated users from /host to /', async ({ page }) => {
    await page.goto('/host')

    // Should redirect to landing page
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'The Guest Kitchen' })).toBeVisible()
  })

  test('should have proper sign-in button configuration', async ({ page }) => {
    await page.goto('/')

    // Check that the sign-in button is properly rendered and clickable
    const signInButton = page.getByRole('button', { name: 'Sign in with Google' })
    await expect(signInButton).toBeVisible()
    await expect(signInButton).toBeEnabled()
  })
})
