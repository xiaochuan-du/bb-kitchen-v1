import { test, expect, devices } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    })
    const page = await context.newPage()

    await page.goto('/')

    // Check main heading is visible on mobile
    await expect(page.getByRole('heading', { name: 'Table Mate' })).toBeVisible()

    // Check sign-in button is visible on mobile
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()

    await context.close()
  })

  test('should be responsive on tablet', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro'],
    })
    const page = await context.newPage()

    await page.goto('/')

    // Check main heading is visible on tablet
    await expect(page.getByRole('heading', { name: 'Table Mate' })).toBeVisible()

    await context.close()
  })

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    // Check main heading is visible on desktop
    await expect(page.getByRole('heading', { name: 'Table Mate' })).toBeVisible()
  })
})
