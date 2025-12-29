'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import Image from 'next/image'

type Event = Database['public']['Tables']['events']['Row']
type Dish = Database['public']['Tables']['dishes']['Row']
type Guest = Database['public']['Tables']['guests']['Row']
type Selection = Database['public']['Tables']['selections']['Row']
type DessertVote = Database['public']['Tables']['dessert_votes']['Row']

export default function GuestMenuGallery({
  event,
  dishes,
  guest,
  existingSelection,
  existingVote,
}: {
  event: Event
  dishes: Dish[]
  guest: Guest
  existingSelection: Selection | null
  existingVote: DessertVote | null
}) {
  const [selectedMainId, setSelectedMainId] = useState<string | null>(
    existingSelection?.selected_main_id || null
  )
  const [selectedDessertId, setSelectedDessertId] = useState<string | null>(
    existingVote?.dessert_id || null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(guest.has_responded)

  const getDishById = (id: string) => dishes.find(d => d.id === id)

  const appetizers = event.appetizer_ids.map(getDishById).filter(Boolean) as Dish[]
  const mains = event.main_dish_ids.map(getDishById).filter(Boolean) as Dish[]
  const desserts = event.dessert_ids.map(getDishById).filter(Boolean) as Dish[]

  const handleSubmit = async () => {
    if (event.main_selection_type === 'choose_one' && !selectedMainId) {
      alert('Please select a main course')
      return
    }

    if (!selectedDessertId) {
      alert('Please vote for a dessert')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    const { error: selectionError } = await supabase
      .from('selections')
      .upsert({
        guest_id: guest.id,
        event_id: event.id,
        selected_main_id: selectedMainId,
      } as never)

    const { error: voteError } = await supabase
      .from('dessert_votes')
      .upsert({
        guest_id: guest.id,
        event_id: event.id,
        dessert_id: selectedDessertId,
      } as never)

    const { error: guestError } = await supabase
      .from('guests')
      .update({ has_responded: true } as never)
      .eq('id', guest.id)

    if (selectionError || voteError || guestError) {
      console.error('Error submitting:', { selectionError, voteError, guestError })
      alert('Error submitting your selections. Please try again.')
    } else {
      setHasSubmitted(true)
    }

    setIsSubmitting(false)
  }

  const DishCard = ({ dish, category }: { dish: Dish; category: string }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
      {dish.image_url && (
        <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-700">
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {dish.name}
        </h3>
        {dish.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            {dish.description}
          </p>
        )}

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500 text-xl">⚠️</span>
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              Allergy Warning - Contains:
            </span>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {dish.ingredients.map((ing, i) => (
                <li key={i}>• {ing}</li>
              ))}
            </ul>
          </div>
        </div>

        {dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dish.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Thank You for Your Response!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Your selections have been recorded. We look forward to hosting you!
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
              {event.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {event.title}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
            {new Date(event.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Hello {guest.email}! Please select your preferences below.
          </p>
        </div>

        <div className="space-y-12">
          {appetizers.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Appetizers
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  These appetizers will be served to all guests
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appetizers.map(dish => (
                  <DishCard key={dish.id} dish={dish} category="appetizer" />
                ))}
              </div>
            </section>
          )}

          {mains.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Main Courses
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {event.main_selection_type === 'choose_one'
                    ? 'Please choose one main course option'
                    : 'All main courses will be served'
                  }
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mains.map(dish => (
                  <div
                    key={dish.id}
                    className={`cursor-pointer transition ${
                      event.main_selection_type === 'choose_one'
                        ? selectedMainId === dish.id
                          ? 'ring-4 ring-orange-500'
                          : 'opacity-70 hover:opacity-100'
                        : ''
                    }`}
                    onClick={() => {
                      if (event.main_selection_type === 'choose_one') {
                        setSelectedMainId(dish.id)
                      }
                    }}
                  >
                    <DishCard dish={dish} category="main" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {desserts.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Desserts - Vote for Your Favorite!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  The most popular dessert will be served to everyone
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {desserts.map(dish => (
                  <div
                    key={dish.id}
                    className={`cursor-pointer transition ${
                      selectedDessertId === dish.id
                        ? 'ring-4 ring-orange-500'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedDessertId(dish.id)}
                  >
                    <DishCard dish={dish} category="dessert" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit My Selections'}
          </button>
        </div>
      </div>
    </div>
  )
}
