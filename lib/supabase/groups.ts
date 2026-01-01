import { createClient } from './server'
import type { Database } from '@/types/database'

type Group = Database['public']['Tables']['groups']['Row']
type GroupMember = Database['public']['Tables']['group_members']['Row']

export type GroupWithRole = Group & { role: GroupMember['role'] }

/**
 * Get all groups the current user belongs to
 */
export async function getUserGroups(): Promise<GroupWithRole[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Query groups directly with inner join on memberships
  // This approach works better with RLS policies
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(role)
    `)
    .eq('group_members.user_id', user.id)

  if (error) {
    console.error('Error fetching groups:', error)
    return []
  }

  if (!groups) return []

  return groups
    .map(g => ({
      id: g.id,
      created_at: g.created_at,
      name: g.name,
      description: g.description,
      owner_id: g.owner_id,
      is_personal: g.is_personal,
      role: (g.group_members as any)[0]?.role as GroupMember['role']
    }))
    .sort((a, b) => {
      // Personal groups first, then alphabetically
      if (a.is_personal && !b.is_personal) return -1
      if (!a.is_personal && b.is_personal) return 1
      return a.name.localeCompare(b.name)
    })
}

/**
 * Get user's personal group
 */
export async function getPersonalGroup(): Promise<Group | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', user.id)
    .eq('is_personal', true)
    .single()

  return data
}

/**
 * Validate that user has access to a group
 */
export async function validateGroupAccess(groupId: string): Promise<GroupWithRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Query the group with inner join to verify membership
  const { data: group, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(role)
    `)
    .eq('id', groupId)
    .eq('group_members.user_id', user.id)
    .single()

  if (error || !group) return null

  return {
    id: group.id,
    created_at: group.created_at,
    name: group.name,
    description: group.description,
    owner_id: group.owner_id,
    is_personal: group.is_personal,
    role: (group.group_members as any)[0]?.role as GroupMember['role']
  }
}

/**
 * Get the active group from URL parameter or default to personal group
 */
export async function getActiveGroup(groupIdParam?: string): Promise<GroupWithRole | null> {
  // If a group ID is provided, validate access
  if (groupIdParam) {
    const group = await validateGroupAccess(groupIdParam)
    if (group) return group
  }

  // Fall back to personal group (first in sorted list)
  const groups = await getUserGroups()
  return groups.find(g => g.is_personal) || groups[0] || null
}

/**
 * Check if user can manage group (owner or admin)
 */
export function canManageGroup(role: GroupMember['role']): boolean {
  return role === 'owner' || role === 'admin'
}

/**
 * Check if user can delete group (owner of non-personal group)
 */
export function canDeleteGroup(role: GroupMember['role'], isPersonal: boolean): boolean {
  return role === 'owner' && !isPersonal
}
