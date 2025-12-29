'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

export default function EventsList({ initialEvents }: { initialEvents: Event[] }) {
  const [events] = useState<Event[]>(initialEvents)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'closed': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Events
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {events.length} events
          </p>
        </div>
        <Link
          href="/host/events/new"
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm"
        >
          + New Event
        </Link>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/host/events/${event.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {event.title}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </Link>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No events yet
          </p>
          <Link
            href="/host/events/new"
            className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm"
          >
            Create Your First Event
          </Link>
        </div>
      )}
    </div>
  )
}
