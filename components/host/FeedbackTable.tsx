'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']
type Dish = Database['public']['Tables']['dishes']['Row']
type Guest = Database['public']['Tables']['guests']['Row']
type DishFeedback = Database['public']['Tables']['dish_feedback']['Row']
type EventFeedback = Database['public']['Tables']['event_feedback']['Row']

export default function FeedbackTable({
  event,
  dishes,
  guests,
  dishFeedback,
  eventFeedback,
}: {
  event: Event
  dishes: Dish[]
  guests: Guest[]
  dishFeedback: DishFeedback[]
  eventFeedback: EventFeedback[]
}) {
  const [selectedComment, setSelectedComment] = useState<{ guest: string; dish: string; comment: string } | null>(null)

  const getDishById = (id: string) => dishes.find(d => d.id === id)

  const appetizers = event.appetizer_ids.map(getDishById).filter(Boolean) as Dish[]
  const mains = event.main_dish_ids.map(getDishById).filter(Boolean) as Dish[]
  const desserts = event.dessert_ids.map(getDishById).filter(Boolean) as Dish[]
  const allDishes = [...appetizers, ...mains, ...desserts]

  const respondedGuests = guests.filter(g => g.has_submitted_feedback)

  const getFeedback = (guestId: string, dishId: string) => {
    return dishFeedback.find(f => f.guest_id === guestId && f.dish_id === dishId)
  }

  const getEventFeedback = (guestId: string) => {
    return eventFeedback.find(f => f.guest_id === guestId)
  }

  // Calculate summary stats
  const getDishStats = (dishId: string) => {
    const feedbacks = dishFeedback.filter(f => f.dish_id === dishId)
    const ups = feedbacks.filter(f => f.rating === 'up').length
    const downs = feedbacks.filter(f => f.rating === 'down').length
    return { ups, downs, total: feedbacks.length }
  }

  if (respondedGuests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Guest Feedback
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            No feedback submitted yet.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Send feedback survey links to guests who attended the event.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Guest Feedback
      </h2>

      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {respondedGuests.length} of {guests.length} guests submitted feedback
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 sticky left-0 z-10">
                Dish
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                Summary
              </th>
              {respondedGuests.map(guest => (
                <th key={guest.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 min-w-[100px]">
                  <div className="truncate max-w-[100px]" title={guest.email}>
                    {guest.email.split('@')[0]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {allDishes.map((dish, index) => {
              const stats = getDishStats(dish.id)
              return (
                <tr key={dish.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap sticky left-0 z-10" style={{ backgroundColor: 'inherit' }}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        dish.category === 'appetizer' ? 'bg-amber-400' :
                        dish.category === 'main' ? 'bg-green-500' : 'bg-pink-400'
                      }`}></span>
                      <span className="truncate max-w-[150px]" title={dish.name}>{dish.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {stats.total > 0 ? (
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                          </svg>
                          {stats.ups}
                        </span>
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                          </svg>
                          {stats.downs}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  {respondedGuests.map(guest => {
                    const feedback = getFeedback(guest.id, dish.id)
                    return (
                      <td key={guest.id} className="px-3 py-3 text-center">
                        {feedback ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                              feedback.rating === 'up'
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                            }`}>
                              {feedback.rating === 'up' ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                                </svg>
                              )}
                            </span>
                            {feedback.comment && (
                              <button
                                onClick={() => setSelectedComment({
                                  guest: guest.email,
                                  dish: dish.name,
                                  comment: feedback.comment!
                                })}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Event Comments Section */}
      {eventFeedback.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Overall Event Comments
          </h3>
          <div className="space-y-3">
            {eventFeedback.filter(f => f.comment).map(feedback => {
              const guest = guests.find(g => g.id === feedback.guest_id)
              return (
                <div key={feedback.id} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.comment}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    — {guest?.email || 'Guest'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedComment(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Feedback for {selectedComment.dish}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              From: {selectedComment.guest}
            </p>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              {selectedComment.comment}
            </p>
            <button
              onClick={() => setSelectedComment(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
