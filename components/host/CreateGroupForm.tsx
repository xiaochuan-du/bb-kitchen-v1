'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be signed in')
      setIsLoading(false)
      return
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description: description || null,
        owner_id: user.id,
        is_personal: false,
      })
      .select()
      .single()

    if (groupError || !group) {
      console.error('Error creating group:', groupError)
      alert('Error creating group. Please try again.')
      setIsLoading(false)
      return
    }

    // Add the creator as owner member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Error adding member:', memberError)
      // Clean up the group if member addition fails
      await supabase.from('groups').delete().eq('id', group.id)
      alert('Error creating group. Please try again.')
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    router.push(`/host/settings/groups/${group.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Group Name <span className="text-[var(--accent-warm)]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="
            w-full px-4 py-3
            bg-secondary border border-subtle rounded-lg
            text-primary text-sm placeholder:text-tertiary
            focus:outline-none focus:ring-2 focus:ring-[var(--accent-earth)]/20 focus:border-[var(--accent-earth)]/50
            transition-colors duration-150
          "
          placeholder="e.g., Family Kitchen"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Description
          <span className="ml-2 text-xs font-normal text-tertiary">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="
            w-full px-4 py-3
            bg-secondary border border-subtle rounded-lg
            text-primary text-sm placeholder:text-tertiary
            focus:outline-none focus:ring-2 focus:ring-[var(--accent-earth)]/20 focus:border-[var(--accent-earth)]/50
            transition-colors duration-150
            resize-none
          "
          placeholder="What's this group for?"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !name.trim()}
        className="
          flex items-center justify-center gap-2
          w-full px-6 py-3
          bg-[var(--accent-earth)] text-white rounded-lg
          text-sm font-medium
          hover:bg-[var(--accent-earth)]/90
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
          cursor-pointer
        "
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Group
          </>
        )}
      </button>
    </form>
  )
}
