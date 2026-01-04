'use client'

import { useState, useEffect } from 'react'
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
  const [memberToRemove, setMemberToRemove] = useState<MemberWithProfile | null>(null)

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMemberToRemove(null)
      }
    }

    if (memberToRemove) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [memberToRemove])

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
    setMemberToRemove(null)
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

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] border-[var(--accent-warm)]/20'
      case 'admin':
        return 'bg-[var(--accent-earth)]/10 text-[var(--accent-earth)] border-[var(--accent-earth)]/20'
      default:
        return 'bg-accent text-tertiary border-subtle'
    }
  }

  return (
    <div className="space-y-4">
      {/* Members List */}
      <div className="space-y-2">
        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-subtle hover:border-[var(--accent-earth)]/20 transition-colors duration-150"
          >
            <div className="flex items-center gap-3">
              {member.profile?.avatar_url ? (
                <img
                  src={member.profile.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-sm font-medium text-tertiary uppercase">
                    {member.profile?.email?.[0] || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-primary text-sm">
                  {member.profile?.name || member.profile?.email || 'Unknown'}
                  {member.user_id === currentUserId && (
                    <span className="ml-2 text-xs text-tertiary">(you)</span>
                  )}
                </p>
                <p className="text-xs text-tertiary">
                  {member.profile?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {member.role === 'owner' ? (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${getRoleBadgeStyle('owner')}`}>
                  Owner
                </span>
              ) : isManager && member.user_id !== currentUserId ? (
                <>
                  {/* Role Selector */}
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value as 'admin' | 'member')}
                      className="
                        appearance-none text-xs font-medium px-3 py-1.5 pr-7
                        bg-secondary border border-subtle rounded-md
                        text-primary cursor-pointer
                        hover:border-[var(--accent-earth)]/30
                        focus:outline-none focus:ring-2 focus:ring-[var(--accent-earth)]/20
                        transition-colors duration-150
                      "
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <svg
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-tertiary pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => setMemberToRemove(member)}
                    className="
                      p-1.5 rounded-md
                      text-tertiary hover:text-[var(--accent-warm)] hover:bg-[var(--accent-warm)]/10
                      transition-colors duration-150
                      cursor-pointer
                    "
                    title="Remove member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              ) : (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${getRoleBadgeStyle(member.role)}`}>
                  {member.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Form */}
      {isManager && (
        <form onSubmit={handleAddMember} className="flex gap-3 pt-4 border-t border-subtle">
          <div className="flex-1 relative">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter email to invite"
              className="
                w-full px-4 py-2.5
                bg-secondary border border-subtle rounded-lg
                text-primary text-sm placeholder:text-tertiary
                focus:outline-none focus:ring-2 focus:ring-[var(--accent-earth)]/20 focus:border-[var(--accent-earth)]/50
                transition-colors duration-150
              "
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || !newMemberEmail.trim()}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-[var(--accent-earth)] text-white rounded-lg
              text-sm font-medium
              hover:bg-[var(--accent-earth)]/90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
              cursor-pointer
            "
          >
            {isAdding ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Member
              </>
            )}
          </button>
        </form>
      )}

      {/* Remove Member Modal */}
      {memberToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setMemberToRemove(null)}
        >
          <div
            className="
              w-full max-w-sm
              bg-primary border border-subtle rounded-xl
              shadow-[0_25px_60px_var(--shadow-medium)]
              animate-scale-in
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent-warm)]/10">
                  <svg className="w-5 h-5 text-[var(--accent-warm)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">Remove Member</h3>
                  <p className="text-sm text-secondary">
                    Remove <span className="font-medium text-primary">{memberToRemove.profile?.name || memberToRemove.profile?.email}</span>?
                  </p>
                </div>
              </div>

              <p className="text-sm text-tertiary mb-6">
                They will lose access to all dishes and events in this group.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMemberToRemove(null)}
                  className="
                    flex-1 px-4 py-2.5
                    bg-secondary border border-subtle rounded-lg
                    text-primary text-sm font-medium
                    hover:bg-accent
                    transition-colors duration-150
                    cursor-pointer
                  "
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveMember(memberToRemove.id)}
                  disabled={removingId === memberToRemove.id}
                  className="
                    flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                    bg-[var(--accent-warm)] text-white rounded-lg
                    text-sm font-medium
                    hover:bg-[#A85E45]
                    disabled:opacity-50
                    transition-colors duration-150
                    cursor-pointer
                  "
                >
                  {removingId === memberToRemove.id ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
