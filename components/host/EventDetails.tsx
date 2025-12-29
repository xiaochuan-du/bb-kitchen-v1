'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

export default function EventDetails({ event }: { event: Event }) {
  const router = useRouter()
  const [status, setStatus] = useState(event.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: typeof status) => {
    setIsUpdating(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus } as never)
      .eq('id', event.id)

    if (!error) {
      setStatus(newStatus)
      router.refresh()
    } else {
      console.error('Error updating status:', error)
    }
    setIsUpdating(false)
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'closed': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {event.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {new Date(event.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>

      {event.description && (
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {event.description}
        </p>
      )}

      <div className="flex gap-3">
        {status === 'draft' && (
          <button
            onClick={() => handleStatusChange('active')}
            disabled={isUpdating}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
          >
            Activate Event
          </button>
        )}
        {status === 'active' && (
          <button
            onClick={() => handleStatusChange('closed')}
            disabled={isUpdating}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
          >
            Close Event
          </button>
        )}
        {status === 'closed' && (
          <button
            onClick={() => handleStatusChange('active')}
            disabled={isUpdating}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
          >
            Reopen Event
          </button>
        )}
      </div>
    </div>
  )
}
