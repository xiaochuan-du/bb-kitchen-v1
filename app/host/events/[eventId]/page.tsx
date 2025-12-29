import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import HostNav from '@/components/host/HostNav'
import Link from 'next/link'
import EventDetails from '@/components/host/EventDetails'
import GuestInvitations from '@/components/host/GuestInvitations'
import OrderSummary from '@/components/host/OrderSummary'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']
type Guest = Database['public']['Tables']['guests']['Row']
type Dish = Database['public']['Tables']['dishes']['Row']
type Selection = Database['public']['Tables']['selections']['Row']
type DessertVote = Database['public']['Tables']['dessert_votes']['Row']

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single<Event>()

  if (error || !event) {
    notFound()
  }

  if (event.host_id !== user.id) {
    redirect('/host')
  }

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)

  const allDishIds = [
    ...event.appetizer_ids,
    ...event.main_dish_ids,
    ...event.dessert_ids,
  ]

  const { data: dishes } = await supabase
    .from('dishes')
    .select('*')
    .in('id', allDishIds)

  const { data: selections } = await supabase
    .from('selections')
    .select('*')
    .eq('event_id', eventId)

  const { data: votes } = await supabase
    .from('dessert_votes')
    .select('*')
    .eq('event_id', eventId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HostNav user={user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/host"
            className="text-orange-600 dark:text-orange-400 hover:underline text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <EventDetails event={event} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <GuestInvitations
            eventId={eventId}
            initialGuests={guests || []}
          />
          <OrderSummary
            event={event}
            dishes={dishes || []}
            guests={guests || []}
            selections={selections || []}
            votes={votes || []}
          />
        </div>
      </main>
    </div>
  )
}
