'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

interface EventsListProps {
  initialEvents: Event[]
  groupId: string
}

export default function EventsList({ initialEvents, groupId }: EventsListProps) {
  const [events] = useState<Event[]>(initialEvents)

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-[var(--accent-sage)]/15 text-[var(--accent-forest)] border-[var(--accent-sage)]/30'
      case 'active': return 'bg-[var(--accent-forest)]/15 text-[var(--accent-forest)] border-[var(--accent-forest)]/30'
      case 'closed': return 'bg-[var(--accent-earth)]/15 text-[var(--accent-earth)] border-[var(--accent-earth)]/30'
      default: return 'bg-accent text-tertiary border-subtle'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-primary tracking-tight mb-1">
            Events
          </h2>
          <p className="font-sans text-sm text-tertiary">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        <Link
          href={`/host/events/new?group=${groupId}`}
          className="
            flex items-center gap-2
            font-sans px-5 py-2.5
            bg-[var(--accent-warm)] text-white rounded-lg
            hover:bg-[var(--accent-earth)]
            transition-all duration-200
            font-medium text-sm
            shadow-sm hover:shadow-md
            cursor-pointer
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </Link>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => (
          <Link
            key={event.id}
            href={`/host/events/${event.id}`}
            className="
              block bg-secondary rounded-lg p-5 border border-subtle
              hover:border-[var(--accent-warm)]/40 hover:shadow-[0_8px_30px_var(--shadow-soft)]
              transition-all duration-200
              group animate-fade-in-up
              cursor-pointer
            "
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-display font-semibold text-primary text-lg group-hover:text-[var(--accent-warm)] transition-colors duration-200">
                {event.title}
              </h3>
              <span className={`text-xs px-2.5 py-1 rounded-md font-sans font-medium border ${getStatusStyles(event.status)}`}>
                {event.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-secondary">
              <svg className="w-4 h-4 text-[var(--accent-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-sans text-sm">
                {new Date(event.event_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {events.length === 0 && (
        <div className="relative text-center py-16 bg-secondary border-2 border-dashed border-subtle rounded-xl overflow-hidden group hover:border-[var(--accent-sage)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-warm)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative max-w-sm mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--accent-earth)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-display text-xl text-primary mb-2">
              No events yet
            </p>
            <p className="font-sans text-sm text-tertiary mb-6">
              Create your first event to start hosting
            </p>
            <Link
              href={`/host/events/new?group=${groupId}`}
              className="
                inline-flex items-center gap-2
                font-sans px-6 py-3
                bg-[var(--accent-warm)] text-white rounded-lg
                hover:bg-[var(--accent-earth)]
                transition-all duration-200
                font-medium text-sm
                shadow-sm hover:shadow-md
                cursor-pointer
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Event
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
