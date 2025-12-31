'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SelectionInsert = Database['public']['Tables']['selections']['Insert']
type DessertVoteInsert = Database['public']['Tables']['dessert_votes']['Insert']
type DishFeedbackInsert = Database['public']['Tables']['dish_feedback']['Insert']
type EventFeedbackInsert = Database['public']['Tables']['event_feedback']['Insert']

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

type FeedbackData = {
  guestId: string
  eventId: string
  magicToken: string
  dishFeedback: Array<{
    dishId: string
    rating: 'up' | 'down'
    comment: string | null
  }>
  eventComment: string | null
}

export async function submitGuestFeedback({
  guestId,
  eventId,
  magicToken,
  dishFeedback,
  eventComment,
}: FeedbackData) {
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

  // Submit dish feedback
  for (const feedback of dishFeedback) {
    const feedbackData: DishFeedbackInsert = {
      guest_id: guestId,
      event_id: eventId,
      dish_id: feedback.dishId,
      rating: feedback.rating,
      comment: feedback.comment,
    }

    const { error: feedbackError } = await supabase
      .from('dish_feedback')
      .upsert(feedbackData, { onConflict: 'guest_id,dish_id' })

    if (feedbackError) {
      console.error('Failed to save dish feedback:', feedbackError)
      throw new Error('Failed to save dish feedback')
    }
  }

  // Submit event feedback if provided
  if (eventComment) {
    const eventFeedbackData: EventFeedbackInsert = {
      guest_id: guestId,
      event_id: eventId,
      comment: eventComment,
    }

    const { error: eventFeedbackError } = await supabase
      .from('event_feedback')
      .upsert(eventFeedbackData, { onConflict: 'guest_id,event_id' })

    if (eventFeedbackError) {
      console.error('Failed to save event feedback:', eventFeedbackError)
      throw new Error('Failed to save event feedback')
    }
  }

  // Update guest status
  const { error: guestError } = await supabase
    .from('guests')
    .update({ has_submitted_feedback: true })
    .eq('id', guestId)

  if (guestError) throw new Error('Failed to update guest status')

  return { success: true }
}
