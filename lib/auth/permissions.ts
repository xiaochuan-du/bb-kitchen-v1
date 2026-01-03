/**
 * Authorization utilities for checking user permissions
 */

const ALLOWED_HOST_EMAILS = [
  'dxiaochuan@gmail.com',
  'yang.niceday@gmail.com',
]

/**
 * Check if a user email is authorized to create events and dishes
 *
 * In development mode with ALLOW_ALL_HOSTS=true, all emails are allowed.
 * This is used for E2E testing with dynamically created test users.
 */
export function canCreateEventsAndDishes(email: string | undefined): boolean {
  if (!email) return false

  // Allow all emails in development mode for E2E testing
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_ALL_HOSTS === 'true'
  ) {
    return true
  }

  return ALLOWED_HOST_EMAILS.includes(email.toLowerCase())
}
