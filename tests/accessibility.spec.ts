import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('landing page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    // Check H1 exists
    const h1 = page.getByRole('heading', { level: 1, name: 'Table Mate' })
    await expect(h1).toBeVisible()

    // Check H2 exists
    const h2 = page.getByRole('heading', { level: 2, name: 'For Hosts' })
    await expect(h2).toBeVisible()
  })

  test('landing page should have proper semantic structure', async ({ page }) => {
    await page.goto('/')

    // Check for main sections
    const forHostsSection = page.getByRole('heading', { name: 'For Hosts' })
    await expect(forHostsSection).toBeVisible()

    const forGuestsSection = page.getByRole('heading', { name: 'For Guests' })
    await expect(forGuestsSection).toBeVisible()
  })

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/')

    const signInButton = page.getByRole('button', { name: 'Sign in with Google' })

    // Button should be focusable
    await signInButton.focus()
    await expect(signInButton).toBeFocused()
  })
})
