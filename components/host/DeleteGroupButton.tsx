'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DeleteGroupButtonProps {
  groupId: string
  groupName: string
}

export default function DeleteGroupButton({ groupId, groupName }: DeleteGroupButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This will also delete all dishes and events in this group. This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      console.error('Error deleting group:', error)
      alert('Error deleting group. Please try again.')
      setIsDeleting(false)
      return
    }

    router.push('/host/settings/groups')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete Group'}
    </button>
  )
}
