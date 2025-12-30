import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/')

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Table Mate' })).toBeVisible()

    // Check tagline
    await expect(page.getByText('Curated menu experiences for hosting with care')).toBeVisible()

    // Check sign-in button
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  })

  test('should have correct meta information', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page).toHaveTitle(/Table Mate|Guest Kitchen/i)
  })

  test('should display features list for hosts', async ({ page }) => {
    await page.goto('/')

    // Check features are visible
    await expect(page.getByText('Build your dish library with images and ingredients')).toBeVisible()
    await expect(page.getByText('Create events with smart menu logic')).toBeVisible()
    await expect(page.getByText('Send magic links to guests via email')).toBeVisible()
    await expect(page.getByText('Get a complete shopping list 48 hours before')).toBeVisible()
  })
})
