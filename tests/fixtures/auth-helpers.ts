/**
 * Authentication helpers for E2E testing
 */

import { Page } from '@playwright/test'

/**
 * Authenticate a user by navigating to the test-login endpoint
 * This creates a session and sets cookies for the specified email
 */
export async function authenticateUser(
  page: Page,
  email: string
): Promise<void> {
  // Navigate to the test-login endpoint with the email
  const response = await page.goto(
    `/api/auth/test-login?email=${encodeURIComponent(email)}`
  )

  // The endpoint redirects to /host on success
  // Wait for the redirect to complete
  await page.waitForURL('**/host**', { timeout: 10000 })

  // Verify we're authenticated by checking we're on the host page
  const url = page.url()
  if (!url.includes('/host')) {
    throw new Error(`Authentication failed for ${email}. Current URL: ${url}`)
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser(page: Page): Promise<void> {
  // Clear cookies and local storage
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Build guest invite URL
 */
export function getGuestInviteUrl(eventId: string, magicToken: string): string {
  return `/guest/${eventId}?token=${magicToken}`
}

/**
 * Build guest feedback URL
 */
export function getGuestFeedbackUrl(eventId: string, magicToken: string): string {
  return `/guest/${eventId}/feedback?token=${magicToken}`
}
