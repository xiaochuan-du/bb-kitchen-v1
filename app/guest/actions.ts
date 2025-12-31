'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SelectionInsert = Database['public']['Tables']['selections']['Insert']
type DessertVoteInsert = Database['public']['Tables']['dessert_votes']['Insert']

type SelectionData = {
  guestId: string
  eventId: string
  selectedMainId: string | null
  selectedDessertId: string | null
  magicToken: string
}

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function submitGuestSelection({
  guestId,
  eventId,
  selectedMainId,
  selectedDessertId,
  magicToken,
}: SelectionData) {
  const supabase = getServiceClient()

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
  const selectionData: SelectionInsert = {
    guest_id: guestId,
    event_id: eventId,
    selected_main_id: selectedMainId,
  }
  const { error: selectionError } = await supabase
    .from('selections')
    .upsert(selectionData, { onConflict: 'guest_id,event_id' })

  if (selectionError) throw new Error('Failed to save selection')

  if (selectedDessertId) {
    const voteData: DessertVoteInsert = {
      guest_id: guestId,
      event_id: eventId,
      dessert_id: selectedDessertId,
    }
    const { error: voteError } = await supabase
      .from('dessert_votes')
      .upsert(voteData, { onConflict: 'guest_id,event_id' })

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
