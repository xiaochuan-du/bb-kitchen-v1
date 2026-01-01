'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type GroupMember = Database['public']['Tables']['group_members']['Row']

type MemberWithProfile = GroupMember & {
  profile: Profile | null
}

interface GroupMemberListProps {
  groupId: string
  members: MemberWithProfile[]
  currentUserId: string
  isManager: boolean
}

export default function GroupMemberList({
  groupId,
  members,
  currentUserId,
  isManager,
}: GroupMemberListProps) {
  const router = useRouter()
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberEmail.trim()) return

    setIsAdding(true)
    const supabase = createClient()

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', newMemberEmail.toLowerCase())
      .single()

    if (profileError || !profile) {
      alert('User not found. They need to sign up first.')
      setIsAdding(false)
      return
    }

    // Check if already a member
    const existingMember = members.find(m => m.user_id === profile.id)
    if (existingMember) {
      alert('This user is already a member of this group.')
      setIsAdding(false)
      return
    }

    // Add as member
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: profile.id,
        role: 'member',
      })

    if (error) {
      console.error('Error adding member:', error)
      alert('Error adding member. Please try again.')
    } else {
      setNewMemberEmail('')
      router.refresh()
    }

    setIsAdding(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    setRemovingId(memberId)
    const supabase = createClient()

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      console.error('Error removing member:', error)
      alert('Error removing member. Please try again.')
    } else {
      router.refresh()
    }

    setRemovingId(null)
  }

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    const supabase = createClient()

    const { error } = await supabase
      .from('group_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (error) {
      console.error('Error updating role:', error)
      alert('Error updating role. Please try again.')
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              {member.profile?.avatar_url ? (
                <img
                  src={member.profile.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {member.profile?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {member.profile?.name || member.profile?.email || 'Unknown'}
                  {member.user_id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-500">(you)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {member.profile?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {member.role === 'owner' ? (
                <span className="text-sm px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                  Owner
                </span>
              ) : isManager && member.user_id !== currentUserId ? (
                <>
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value as 'admin' | 'member')}
                    className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removingId === member.id}
                    className="text-sm px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                  >
                    {removingId === member.id ? 'Removing...' : 'Remove'}
                  </button>
                </>
              ) : (
                <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                  {member.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {isManager && (
        <form onSubmit={handleAddMember} className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Enter email to add member"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={isAdding}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}
    </div>
  )
}
