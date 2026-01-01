import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import HostNav from '@/components/host/HostNav'
import Link from 'next/link'
import { getUserGroups, validateGroupAccess, canManageGroup, canDeleteGroup } from '@/lib/supabase/groups'
import GroupMemberList from '@/components/host/GroupMemberList'
import DeleteGroupButton from '@/components/host/DeleteGroupButton'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type GroupMember = Database['public']['Tables']['group_members']['Row']

export type MemberWithProfile = GroupMember & {
  profile: Profile | null
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Validate user has access to this group
  const groupAccess = await validateGroupAccess(groupId)
  if (!groupAccess) {
    redirect('/host/settings/groups')
  }

  // Get all groups for nav
  const groups = await getUserGroups()

  // Get group members
  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('role', { ascending: true })

  // Get profiles for all members
  const memberUserIds = members?.map(m => m.user_id) || []
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', memberUserIds)

  // Combine members with their profiles
  const membersWithProfiles: MemberWithProfile[] = (members || []).map(member => ({
    ...member,
    profile: profiles?.find(p => p.id === member.user_id) || null
  }))

  const isManager = canManageGroup(groupAccess.role)
  const canDelete = canDeleteGroup(groupAccess.role, groupAccess.is_personal)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HostNav user={user} groups={groups} currentGroupId={groupId} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/host/settings/groups"
            className="text-orange-600 dark:text-orange-400 hover:underline text-sm"
          >
            ← Back to Groups
          </Link>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {groupAccess.name}
              {groupAccess.is_personal && (
                <span className="ml-3 text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                  Personal
                </span>
              )}
            </h1>
            {groupAccess.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {groupAccess.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Your role: {groupAccess.role}
            </p>
          </div>
          {canDelete && (
            <DeleteGroupButton groupId={groupId} groupName={groupAccess.name} />
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Members ({membersWithProfiles.length})
          </h2>
          <GroupMemberList
            groupId={groupId}
            members={membersWithProfiles}
            currentUserId={user.id}
            isManager={isManager}
          />
        </div>
      </main>
    </div>
  )
}
