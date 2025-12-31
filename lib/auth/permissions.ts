/**
 * Authorization utilities for checking user permissions
 */

const ALLOWED_HOST_EMAILS = [
  'dxiaochuan@gmail.com',
  'yang.niceday@gmail.com',
]

/**
 * Check if a user email is authorized to create events and dishes
 */
export function canCreateEventsAndDishes(email: string | undefined): boolean {
  if (!email) return false
  return ALLOWED_HOST_EMAILS.includes(email.toLowerCase())
}
