/**
 * E2E Test: Core Workflow
 *
 * Tests the most important user workflows:
 * 1. Multi-user group access control (A, B can see dishes; C cannot)
 * 2. Guest invitation link flow with menu selection
 * 3. Guest feedback survey flow
 */

import { test, expect } from '@playwright/test'
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  createSharedGroup,
  addGroupMember,
  deleteGroup,
  verifySupabaseConnection,
} from '../fixtures/supabase-admin'
import {
  generateTestDishes,
  insertTestDishes,
  deleteTestDishes,
  createTestEvent,
  deleteTestEvent,
  addTestGuest,
  getGuest,
  getGuestSelections,
  getGuestFeedback,
} from '../fixtures/test-data'
import {
  authenticateUser,
  signOutUser,
  getGuestInviteUrl,
  getGuestFeedbackUrl,
} from '../fixtures/auth-helpers'
import type { Database } from '../../types/database'

type DishRow = Database['public']['Tables']['dishes']['Row']
type EventRow = Database['public']['Tables']['events']['Row']
type GuestRow = Database['public']['Tables']['guests']['Row']
type GroupRow = Database['public']['Tables']['groups']['Row']

// Test data holders
let userA: { id: string; email: string }
let userB: { id: string; email: string }
let userC: { id: string; email: string }
let sharedGroup: GroupRow
let dishes: DishRow[]
let testEvent: EventRow
let testGuest: GuestRow

// Configure serial execution for proper data flow
test.describe.configure({ mode: 'serial' })

test.describe('TableMate Core Workflow E2E', () => {
  test.beforeAll(async () => {
    // Verify Supabase connection
    await verifySupabaseConnection()

    const timestamp = Date.now()

    // 1. Create three test users programmatically
    console.log('Creating test users...')
    userA = await createTestUser(
      `test-user-a-${timestamp}@example.com`,
      'Test User A'
    )
    userB = await createTestUser(
      `test-user-b-${timestamp}@example.com`,
      'Test User B'
    )
    userC = await createTestUser(
      `test-user-c-${timestamp}@example.com`,
      'Test User C'
    )

    // 2. User A creates a shared group
    console.log('Creating shared group...')
    sharedGroup = await createSharedGroup(
      userA.id,
      `Test Shared Kitchen ${timestamp}`,
      'Shared group for E2E testing'
    )

    // 3. User A adds User B to the group
    console.log('Adding User B to group...')
    await addGroupMember(sharedGroup.id, userB.id, 'member')

    // 4. Insert test dishes via direct DB insert
    console.log('Inserting test dishes...')
    const testDishes = generateTestDishes(sharedGroup.id)
    dishes = await insertTestDishes(testDishes)

    // 5. Create an event with the dishes
    console.log('Creating test event...')
    testEvent = await createTestEvent(
      sharedGroup.id,
      dishes,
      `E2E Test Dinner Party ${timestamp}`
    )

    // 6. Add a guest to the event
    console.log('Adding test guest...')
    testGuest = await addTestGuest(testEvent.id, 'test-guest@example.com')

    console.log('Setup complete!')
  })

  test.afterAll(async () => {
    console.log('Cleaning up test data...')

    // Delete in reverse order to respect foreign key constraints
    try {
      if (testEvent?.id) {
        await deleteTestEvent(testEvent.id)
      }
    } catch (e) {
      console.warn('Failed to delete event:', e)
    }

    try {
      if (dishes?.length) {
        await deleteTestDishes(dishes.map((d) => d.id))
      }
    } catch (e) {
      console.warn('Failed to delete dishes:', e)
    }

    try {
      if (sharedGroup?.id) {
        await deleteGroup(sharedGroup.id)
      }
    } catch (e) {
      console.warn('Failed to delete group:', e)
    }

    // Delete users last (cascades to profiles and personal groups)
    for (const user of [userA, userB, userC]) {
      try {
        if (user?.id) {
          await deleteTestUser(user.id)
        }
      } catch (e) {
        console.warn(`Failed to delete user ${user?.email}:`, e)
      }
    }

    console.log('Cleanup complete!')
  })

  test('User A can see dishes in shared group', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await authenticateUser(page, userA.email)

      // Navigate to host dashboard with group parameter
      await page.goto(`/host?group=${sharedGroup.id}`)

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Verify dishes are visible
      await expect(page.getByText('Test Bruschetta')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText('Test Grilled Salmon')).toBeVisible()
      await expect(page.getByText('Test Tiramisu')).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('User B can see dishes in shared group', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await authenticateUser(page, userB.email)

      await page.goto(`/host?group=${sharedGroup.id}`)
      await page.waitForLoadState('networkidle')

      // Verify dishes are visible
      await expect(page.getByText('Test Bruschetta')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText('Test Grilled Salmon')).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('User C cannot see dishes (not a group member)', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await authenticateUser(page, userC.email)

      // User C navigates to their own dashboard (personal group only)
      await page.goto('/host')
      await page.waitForLoadState('networkidle')

      // Should not see the shared group's dishes
      await expect(page.getByText('Test Bruschetta')).not.toBeVisible()
      await expect(page.getByText('Test Grilled Salmon')).not.toBeVisible()

      // If User C tries to access the shared group directly, they should be redirected
      // or see an empty/error state (depending on implementation)
      await page.goto(`/host?group=${sharedGroup.id}`)
      await page.waitForLoadState('networkidle')

      // Should still not see the dishes (either redirected or no access)
      await expect(page.getByText('Test Bruschetta')).not.toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('Dish image is visible on guest menu', async ({ page }) => {
    // Navigate to guest page with magic token
    const inviteUrl = getGuestInviteUrl(testEvent.id, testGuest.magic_token)
    await page.goto(inviteUrl)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Find the image for Test Grilled Salmon (which has an image_url)
    const salmonImage = page.getByRole('img', { name: 'Test Grilled Salmon' })

    // Verify the image is visible
    await expect(salmonImage).toBeVisible({ timeout: 10000 })

    // Verify the image has loaded correctly (not broken)
    const isLoaded = await salmonImage.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0
    })
    expect(isLoaded).toBe(true)
  })

  test('Guest can access invite link and make selections', async ({ page }) => {
    // Navigate to guest page with magic token
    const inviteUrl = getGuestInviteUrl(testEvent.id, testGuest.magic_token)
    await page.goto(inviteUrl)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify event title is displayed
    await expect(page.getByText(testEvent.title)).toBeVisible({ timeout: 10000 })

    // Verify guest email is displayed
    await expect(page.getByText('test-guest@example.com')).toBeVisible()

    // Verify menu sections are displayed (use role to get headings specifically)
    await expect(page.getByRole('heading', { name: 'Starters' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Main Courses' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Desserts' })).toBeVisible()

    // Select a main course (click on the dish name to select it)
    await page.getByText('Test Grilled Salmon').click()

    // Vote for a dessert
    await page.getByText('Test Tiramisu').click()

    // Submit selections
    await page.getByRole('button', { name: 'Submit My Selections' }).click()

    // Wait for submission and verify success state
    await expect(page.getByText('Thank You')).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByText('Your selections have been recorded')
    ).toBeVisible()
  })

  test('Guest selections are recorded in database', async () => {
    // Refresh guest data
    const updatedGuest = await getGuest(testGuest.id)

    // Verify guest has responded
    expect(updatedGuest?.has_responded).toBe(true)

    // Get selections from database
    const { selection, vote } = await getGuestSelections(testGuest.id)

    // Verify selection was recorded
    expect(selection).toBeTruthy()
    expect(selection?.selected_main_id).toBeTruthy()

    // Verify the selected main is Test Grilled Salmon
    const selectedMain = dishes.find((d) => d.id === selection?.selected_main_id)
    expect(selectedMain?.name).toBe('Test Grilled Salmon')

    // Verify dessert vote was recorded
    expect(vote).toBeTruthy()
    expect(vote?.dessert_id).toBeTruthy()

    // Verify the voted dessert is Test Tiramisu
    const votedDessert = dishes.find((d) => d.id === vote?.dessert_id)
    expect(votedDessert?.name).toBe('Test Tiramisu')
  })

  test('Guest can access feedback link and submit ratings', async ({
    page,
  }) => {
    const feedbackUrl = getGuestFeedbackUrl(testEvent.id, testGuest.magic_token)
    await page.goto(feedbackUrl)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify feedback page loaded
    await expect(page.getByText('How Was Everything?')).toBeVisible({
      timeout: 10000,
    })

    // Rate first two dishes with thumbs up
    // Get all thumbs up buttons and click the first two
    const thumbsUpButtons = page.getByRole('button', { name: 'Thumbs up' })
    await thumbsUpButtons.first().click()
    await thumbsUpButtons.nth(1).click()

    // Add a comment to the first dish
    const commentTextareas = page.getByPlaceholder('Add a comment (optional)')
    await commentTextareas.first().fill('Delicious appetizer!')

    // Add overall event comment
    await page
      .getByPlaceholder('Share any additional thoughts about the event')
      .fill('Great dinner party, loved the atmosphere!')

    // Submit feedback
    await page.getByRole('button', { name: 'Submit Feedback' }).click()

    // Verify success
    await expect(page.getByText('Thank You for Your Feedback')).toBeVisible({
      timeout: 10000,
    })
  })

  test('Guest feedback is recorded in database', async () => {
    // Refresh guest data
    const updatedGuest = await getGuest(testGuest.id)

    // Verify guest has submitted feedback
    expect(updatedGuest?.has_submitted_feedback).toBe(true)

    // Get feedback from database
    const { dishFeedback, eventFeedback } = await getGuestFeedback(testGuest.id)

    // Verify dish feedback was recorded
    expect(dishFeedback).toBeTruthy()
    expect(dishFeedback.length).toBeGreaterThanOrEqual(2)

    // Verify at least two have 'up' rating
    const upRatings = dishFeedback.filter((f) => f.rating === 'up')
    expect(upRatings.length).toBeGreaterThanOrEqual(2)

    // Verify at least one has a comment
    const withComment = dishFeedback.find(
      (f) => f.comment === 'Delicious appetizer!'
    )
    expect(withComment).toBeTruthy()

    // Verify event feedback was recorded
    expect(eventFeedback).toBeTruthy()
    expect(eventFeedback?.comment).toBe(
      'Great dinner party, loved the atmosphere!'
    )
  })
})
