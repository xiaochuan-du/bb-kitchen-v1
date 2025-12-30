import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import GuestMenuGallery from '@/components/guest/GuestMenuGallery'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']
type Guest = Database['public']['Tables']['guests']['Row']
type Dish = Database['public']['Tables']['dishes']['Row']
type Selection = Database['public']['Tables']['selections']['Row']
type DessertVote = Database['public']['Tables']['dessert_votes']['Row']

export default async function GuestEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { eventId } = await params
  const { token } = await searchParams

  // Use service role key to bypass RLS since guests are not authenticated
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Invalid Invitation Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please use the link provided in your invitation.
          </p>
        </div>
      </div>
    )
  }

  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .eq('magic_token', token)
    .single()

  if (guestError || !guest) {
    notFound()
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    notFound()
  }

  const allDishIds = [
    ...event.appetizer_ids,
    ...event.main_dish_ids,
    ...event.dessert_ids,
  ]

  const { data: dishes } = await supabase
    .from('dishes')
    .select<'*', Dish>('*')
    .in('id', allDishIds)

  const { data: existingSelection } = await supabase
    .from('selections')
    .select<'*', Selection>('*')
    .eq('guest_id', guest.id)
    .eq('event_id', eventId)
    .maybeSingle()

  const { data: existingVote } = await supabase
    .from('dessert_votes')
    .select<'*', DessertVote>('*')
    .eq('guest_id', guest.id)
    .eq('event_id', eventId)
    .maybeSingle()

  return (
    <GuestMenuGallery
      event={event}
      dishes={dishes || []}
      guest={guest}
      existingSelection={existingSelection}
      existingVote={existingVote}
    />
  )
}
