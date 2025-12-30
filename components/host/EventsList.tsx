'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

export default function EventsList({ initialEvents }: { initialEvents: Event[] }) {
  const [events] = useState<Event[]>(initialEvents)

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-[#9DAA97]/20 text-[#3D5540] border border-[#9DAA97]/40'
      case 'active': return 'bg-[#3D5540]/20 text-[#3D5540] border border-[#3D5540]/40'
      case 'closed': return 'bg-[#8B7355]/20 text-[#8B7355] border border-[#8B7355]/40'
      default: return 'bg-[#E8E5DF] text-[#4A463F] border border-[#E0DDD6]'
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
          href="/host/events/new"
          className="font-sans px-5 py-2.5 bg-[#C17254] text-white rounded-sm hover:bg-[#8B7355] transition-all duration-300 font-medium text-sm tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          + New Event
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => (
          <Link
            key={event.id}
            href={`/host/events/${event.id}`}
            className="block bg-secondary rounded-lg p-5 border border-subtle hover:border-[#C17254] hover:shadow-xl transition-all duration-300 group animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-display font-semibold text-primary text-lg group-hover:text-[#C17254] transition-colors">
                {event.title}
              </h3>
              <span className={`text-xs px-3 py-1 rounded-sm font-sans font-medium ${getStatusStyles(event.status)}`}>
                {event.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#C17254]">📅</span>
              <p className="font-sans text-sm text-secondary">
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
        <div className="relative text-center py-16 bg-secondary border-2 border-dashed border-subtle rounded-lg overflow-hidden group hover:border-[#9DAA97] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C17254]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative max-w-sm mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#C17254]/10 to-[#3D5540]/10 flex items-center justify-center">
              <div className="text-3xl">📅</div>
            </div>
            <p className="font-serif text-xl text-primary mb-2">
              No events yet
            </p>
            <p className="font-sans text-sm text-tertiary mb-6">
              Create your first event to start hosting
            </p>
            <Link
              href="/host/events/new"
              className="inline-block font-sans px-6 py-3 bg-[#C17254] text-white rounded-sm hover:bg-[#8B7355] transition-all duration-300 font-medium text-sm tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Your First Event
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
