'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SelectionData = {
  guestId: string
  eventId: string
  selectedMainId: string | null
  selectedDessertId: string | null
  magicToken: string
}

export async function submitGuestSelection({
  guestId,
  eventId,
  selectedMainId,
  selectedDessertId,
  magicToken,
}: SelectionData) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the guest matches the token
  const { data: guest, error: verifyError } = await supabase
    .from('guests')
    .select('id')
    .eq('id', guestId)
    .eq('event_id', eventId)
    .eq('magic_token', magicToken)
    .single()

  if (verifyError || !guest) {
    throw new Error('Invalid guest or token')
  }

  // Perform updates
  const { error: selectionError } = await supabase
    .from('selections')
    .upsert({
      guest_id: guestId,
      event_id: eventId,
      selected_main_id: selectedMainId,
    })

  if (selectionError) throw new Error('Failed to save selection')

  if (selectedDessertId) {
    const { error: voteError } = await supabase
      .from('dessert_votes')
      .upsert({
        guest_id: guestId,
        event_id: eventId,
        dessert_id: selectedDessertId,
      })

    if (voteError) throw new Error('Failed to save dessert vote')
  } else {
    // If no dessert selected, remove any existing vote
    const { error: deleteError } = await supabase
      .from('dessert_votes')
      .delete()
      .eq('guest_id', guestId)
      .eq('event_id', eventId)

    if (deleteError) throw new Error('Failed to update dessert vote')
  }

  const { error: guestError } = await supabase
    .from('guests')
    .update({ has_responded: true })
    .eq('id', guestId)

  if (guestError) throw new Error('Failed to update guest status')

  return { success: true }
}
