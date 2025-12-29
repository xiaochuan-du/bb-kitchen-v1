'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Guest = Database['public']['Tables']['guests']['Row']

export default function GuestInvitations({
  eventId,
  initialGuests,
}: {
  eventId: string
  initialGuests: Guest[]
}) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('guests')
      .insert({
        event_id: eventId,
        email: email.trim().toLowerCase(),
      } as never)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        alert('This guest has already been invited')
      } else {
        console.error('Error adding guest:', error)
        alert('Error adding guest')
      }
    } else {
      setGuests([...guests, data])
      setEmail('')
    }
    setIsLoading(false)
  }

  const copyInviteLink = (guest: Guest) => {
    const link = `${window.location.origin}/guest/${eventId}?token=${guest.magic_token}`
    navigator.clipboard.writeText(link)
    alert('Invite link copied to clipboard!')
  }

  const handleRemoveGuest = async (guestId: string) => {
    if (!confirm('Remove this guest?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId)

    if (!error) {
      setGuests(guests.filter(g => g.id !== guestId))
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Guest Invitations
      </h2>

      <form onSubmit={handleAddGuest} className="mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guest@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
          >
            Add Guest
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {guests.map((guest) => (
          <div
            key={guest.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {guest.email}
              </p>
              {guest.has_responded && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  ✓ Responded
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyInviteLink(guest)}
                className="text-sm px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded hover:bg-orange-200 dark:hover:bg-orange-800 transition"
              >
                Copy Link
              </button>
              <button
                onClick={() => handleRemoveGuest(guest.id)}
                className="text-sm px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {guests.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No guests invited yet. Add guests to send them invitations.
        </p>
      )}

      {guests.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Send the copied links to your guests via email or messaging. They can click the link to access the menu and make their selections without creating an account.
          </p>
        </div>
      )}
    </div>
  )
}
