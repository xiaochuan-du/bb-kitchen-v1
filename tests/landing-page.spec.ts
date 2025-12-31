import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/')

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Table Mate' })).toBeVisible()

    // Check tagline
    await expect(page.getByText('Thoughtful menu experiences for hosting with intention')).toBeVisible()

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
    await expect(page.getByText('Curate dishes with images, ingredients, and detailed notes')).toBeVisible()
    await expect(page.getByText('Create events with intelligent menu composition')).toBeVisible()
    await expect(page.getByText('Send elegant magic links directly to your guests')).toBeVisible()
    await expect(page.getByText('Receive a complete shopping list 48 hours in advance')).toBeVisible()
  })
})
