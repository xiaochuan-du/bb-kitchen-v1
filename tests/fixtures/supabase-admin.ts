/**
 * Supabase Admin utilities for E2E testing
 * Uses service role key to bypass RLS for test setup/teardown
 */

import { config } from 'dotenv'
import { join } from 'path'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

type GroupInsert = Database['public']['Tables']['groups']['Insert']
type GroupRow = Database['public']['Tables']['groups']['Row']

let adminClient: SupabaseClient<Database> | null = null

/**
 * Get or create Supabase admin client with service role key
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

/**
 * Create a test user via Supabase Admin API
 * The handle_new_user() trigger automatically creates:
 * - Profile in profiles table
 * - Personal group (is_personal: true)
 * - Group membership as 'owner'
 */
export async function createTestUser(
  email: string,
  name: string
): Promise<{ id: string; email: string }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name },
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  if (!data.user) {
    throw new Error('User creation returned no user data')
  }

  return { id: data.user.id, email: data.user.email! }
}

/**
 * Delete a test user via Supabase Admin API
 * This cascades to profiles, personal groups, and group memberships
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    console.warn(`Warning: Failed to delete user ${userId}: ${error.message}`)
  }
}

/**
 * Get a user's personal group (auto-created on signup)
 */
export async function getUserPersonalGroup(
  userId: string
): Promise<GroupRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_personal', true)
    .single()

  if (error) {
    console.warn(`Warning: Failed to get personal group: ${error.message}`)
    return null
  }

  return data
}

/**
 * Create a shared (non-personal) group
 * Automatically adds the owner as a group member with 'owner' role
 */
export async function createSharedGroup(
  ownerId: string,
  name: string,
  description?: string
): Promise<GroupRow> {
  const supabase = createAdminClient()

  // Insert the group
  const groupData: GroupInsert = {
    name,
    description: description || 'Shared test group',
    owner_id: ownerId,
    is_personal: false,
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert(groupData)
    .select()
    .single()

  if (groupError || !group) {
    throw new Error(`Failed to create group: ${groupError?.message}`)
  }

  // Add owner as group member
  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: ownerId,
    role: 'owner',
  })

  if (memberError) {
    // Rollback: delete the group
    await supabase.from('groups').delete().eq('id', group.id)
    throw new Error(`Failed to add owner as member: ${memberError.message}`)
  }

  return group
}

/**
 * Add a user as a member of a group
 */
export async function addGroupMember(
  groupId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: userId,
    role,
  })

  if (error) {
    throw new Error(`Failed to add group member: ${error.message}`)
  }
}

/**
 * Delete a group (for cleanup)
 * This cascades to group_members, dishes, and events
 */
export async function deleteGroup(groupId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('groups').delete().eq('id', groupId)

  if (error) {
    console.warn(`Warning: Failed to delete group ${groupId}: ${error.message}`)
  }
}

/**
 * Verify the Supabase connection is working
 */
export async function verifySupabaseConnection(): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('groups').select('count').limit(0)

  if (error) {
    throw new Error(
      `Cannot connect to Supabase: ${error.message}. Is the local Docker stack running?`
    )
  }
}
