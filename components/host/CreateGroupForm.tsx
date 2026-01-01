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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Group Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="e.g., Family Kitchen"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Optional description"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Group'}
      </button>
    </form>
  )
}
