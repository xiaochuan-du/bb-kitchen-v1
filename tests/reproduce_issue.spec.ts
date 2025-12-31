import { test, expect } from '@playwright/test'

// Skip: This is a debugging test that requires a running Supabase instance
// Run manually when investigating guest invitation link issues
test.skip('reproduce guest invitation link 404', async ({ page }) => {
  // 1. Login
  await page.goto('/api/auth/dev-login')
  await expect(page).toHaveURL(/\/host/)

  // 2. Create a new event
  await page.getByRole('link', { name: 'Create Event' }).click()
  await page.getByLabel('Event Title').fill('Test Event')
  await page.getByLabel('Date').fill('2025-12-31')
  // Depending on how the form works, we might need to select dishes.
  // Let's assume defaults or simple inputs.
  // Wait, I need to know the form fields.
  // Let's look at `components/host/EventForm.tsx` or just try to fill minimal required.
  // If "Create Event" is complicated, maybe I can use an API call or just verify the existing flow.
  // Assuming there is a "Create Event" button that leads to /host/events/new
  
  // Let's check `app/host/page.tsx` first to see the dashboard.
  // But to save time, I will assume I can create an event via UI.
  // If not, I'll update the test.
  
  // Actually, let's just inspect the network response when adding a guest.
  // But first I need an event.
  // Let's try to find an existing event on the dashboard.
  // If no event, create one.
  
  // For robustness, I'll create a new event.
  // I need to check `components/host/EventForm.tsx` to know the fields.
  // But let's start by navigating to /host/events/new
  await page.goto('/host/events/new')
  await page.getByLabel('Event Title').fill('Reproduction Event')
  await page.getByLabel('Date').fill('2025-12-31')
  
  // I might need to select dishes.
  // Let's assume there are some dishes to select or the form allows skipping.
  // If strict validation, this might fail.
  
  // Submit
  await page.getByRole('button', { name: 'Create Event' }).click()
  
  // Wait for navigation to event details
  await expect(page).toHaveURL(/\/host\/events\/.+/)
  const eventId = page.url().split('/').pop()
  console.log('Created event:', eventId)

  // 3. Add a guest
  const guestEmail = `guest-${Date.now()}@example.com`
  
  // Intercept the response to get the magic token
  const guestResponsePromise = page.waitForResponse(response => 
    response.url().includes('/rest/v1/guests') && response.request().method() === 'POST'
  )
  
  await page.getByPlaceholder('guest@example.com').fill(guestEmail)
  await page.getByRole('button', { name: 'Add Guest' }).click()
  
  const guestResponse = await guestResponsePromise
  const guestData = await guestResponse.json()
  const guest = guestData // It might be wrapped or just the object
  console.log('Guest Data:', guest)
  
  const magicToken = guest.magic_token
  expect(magicToken).toBeTruthy()
  
  // 4. Visit the link
  const inviteLink = `/guest/${eventId}?token=${magicToken}`
  console.log('Visiting:', inviteLink)
  
  await page.goto(inviteLink)
  
  // 5. Check for 404
  // If 404, we might see "This page could not be found" text.
  const notFoundHeading = page.getByRole('heading', { name: 'This page could not be found' })
  await expect(notFoundHeading).not.toBeVisible()
  
  // Check for success (e.g. Menu Gallery)
  // Look for text "Menu" or something specific to the guest page.
  await expect(page.getByText('Menu', { exact: false })).toBeVisible()
})
