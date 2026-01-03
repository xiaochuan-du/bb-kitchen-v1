/**
 * Test data generators for E2E testing
 */

import type { Database } from '../../types/database'
import { createAdminClient } from './supabase-admin'

type DishInsert = Database['public']['Tables']['dishes']['Insert']
type DishRow = Database['public']['Tables']['dishes']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']
type EventRow = Database['public']['Tables']['events']['Row']
type GuestRow = Database['public']['Tables']['guests']['Row']

/**
 * Generate test dishes for a group
 * Returns 7 dishes: 2 appetizers, 3 mains, 2 desserts
 */
export function generateTestDishes(groupId: string): DishInsert[] {
  return [
    // Appetizers
    {
      group_id: groupId,
      name: 'Test Bruschetta',
      category: 'appetizer',
      ingredients: ['bread', 'tomatoes', 'basil', 'garlic', 'olive oil'],
      description: 'Fresh tomato bruschetta with basil',
      tags: ['vegetarian', 'italian'],
    },
    {
      group_id: groupId,
      name: 'Test Caprese Salad',
      category: 'appetizer',
      ingredients: ['mozzarella', 'tomatoes', 'basil', 'olive oil', 'balsamic'],
      description: 'Classic Italian caprese salad',
      tags: ['vegetarian', 'gluten-free'],
    },

    // Main courses
    {
      group_id: groupId,
      name: 'Test Grilled Salmon',
      category: 'main',
      ingredients: ['salmon', 'lemon', 'dill', 'butter', 'garlic'],
      description: 'Pan-seared Atlantic salmon with herbs',
      tags: ['seafood', 'gluten-free'],
      // Use a public placeholder image for testing image visibility
      image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
    },
    {
      group_id: groupId,
      name: 'Test Beef Tenderloin',
      category: 'main',
      ingredients: ['beef tenderloin', 'herbs', 'garlic', 'butter', 'red wine'],
      description: 'Premium aged beef tenderloin',
      tags: ['meat', 'gluten-free'],
    },
    {
      group_id: groupId,
      name: 'Test Mushroom Risotto',
      category: 'main',
      ingredients: ['arborio rice', 'mushrooms', 'parmesan', 'white wine', 'shallots'],
      description: 'Creamy vegetarian risotto',
      tags: ['vegetarian'],
    },

    // Desserts
    {
      group_id: groupId,
      name: 'Test Tiramisu',
      category: 'dessert',
      ingredients: ['mascarpone', 'espresso', 'ladyfingers', 'cocoa', 'eggs'],
      description: 'Classic Italian tiramisu',
      tags: ['italian', 'coffee'],
    },
    {
      group_id: groupId,
      name: 'Test Chocolate Cake',
      category: 'dessert',
      ingredients: ['chocolate', 'flour', 'eggs', 'butter', 'sugar'],
      description: 'Rich chocolate layer cake',
      tags: ['chocolate'],
    },
  ]
}

/**
 * Insert test dishes into the database
 */
export async function insertTestDishes(
  dishes: DishInsert[]
): Promise<DishRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('dishes')
    .insert(dishes)
    .select()

  if (error) {
    throw new Error(`Failed to insert dishes: ${error.message}`)
  }

  return data
}

/**
 * Delete test dishes (for cleanup)
 */
export async function deleteTestDishes(dishIds: string[]): Promise<void> {
  if (dishIds.length === 0) return

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('dishes')
    .delete()
    .in('id', dishIds)

  if (error) {
    console.warn(`Warning: Failed to delete dishes: ${error.message}`)
  }
}

/**
 * Create a test event with dishes
 */
export async function createTestEvent(
  groupId: string,
  dishes: DishRow[],
  title: string = 'E2E Test Dinner Party'
): Promise<EventRow> {
  const supabase = createAdminClient()

  const appetizers = dishes.filter(d => d.category === 'appetizer')
  const mains = dishes.filter(d => d.category === 'main')
  const desserts = dishes.filter(d => d.category === 'dessert')

  const eventData: EventInsert = {
    group_id: groupId,
    title,
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    description: 'Automated E2E test event',
    status: 'active',
    appetizer_ids: appetizers.map(d => d.id),
    main_dish_ids: mains.map(d => d.id),
    dessert_ids: desserts.map(d => d.id),
    main_selection_type: 'choose_one',
  }

  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`)
  }

  return data
}

/**
 * Delete a test event (for cleanup)
 * This cascades to guests, selections, votes, and feedback
 */
export async function deleteTestEvent(eventId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.warn(`Warning: Failed to delete event ${eventId}: ${error.message}`)
  }
}

/**
 * Add a guest to an event
 * The magic_token is auto-generated by the database
 */
export async function addTestGuest(
  eventId: string,
  email: string
): Promise<GuestRow> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('guests')
    .insert({
      event_id: eventId,
      email,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add guest: ${error.message}`)
  }

  return data
}

/**
 * Get guest by ID with updated data
 */
export async function getGuest(guestId: string): Promise<GuestRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single()

  if (error) {
    console.warn(`Warning: Failed to get guest: ${error.message}`)
    return null
  }

  return data
}

/**
 * Get selections for a guest
 */
export async function getGuestSelections(guestId: string) {
  const supabase = createAdminClient()

  const { data: selection } = await supabase
    .from('selections')
    .select('*')
    .eq('guest_id', guestId)
    .single()

  const { data: vote } = await supabase
    .from('dessert_votes')
    .select('*')
    .eq('guest_id', guestId)
    .single()

  return { selection, vote }
}

/**
 * Get feedback for a guest
 */
export async function getGuestFeedback(guestId: string) {
  const supabase = createAdminClient()

  const { data: dishFeedback } = await supabase
    .from('dish_feedback')
    .select('*')
    .eq('guest_id', guestId)

  const { data: eventFeedback } = await supabase
    .from('event_feedback')
    .select('*')
    .eq('guest_id', guestId)
    .single()

  return { dishFeedback: dishFeedback || [], eventFeedback }
}
