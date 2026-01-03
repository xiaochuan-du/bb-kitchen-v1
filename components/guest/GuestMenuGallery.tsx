'use client'

import { useState } from 'react'
import { submitGuestSelection } from '@/app/guest/actions'
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

    setIsSubmitting(true)
    
    try {
      await submitGuestSelection({
        guestId: guest.id,
        eventId: event.id,
        selectedMainId,
        selectedDessertId,
        magicToken: guest.magic_token,
      })
      setHasSubmitted(true)
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Error submitting your selections. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const DishCard = ({ dish, category }: { dish: Dish; category: string }) => (
    <div className="group bg-secondary border border-subtle rounded-sm overflow-hidden shadow-[0_8px_24px_var(--shadow-soft)] hover:shadow-[0_12px_40px_var(--shadow-medium)] transition-all duration-500">
      {dish.image_url && (
        <div className="relative h-72 w-full bg-accent overflow-hidden">
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            unoptimized={dish.image_url.includes('127.0.0.1')}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
      )}
      <div className="p-6">
        <h3 className="text-2xl font-display font-semibold text-primary mb-3 tracking-tight">
          {dish.name}
        </h3>
        {dish.description && (
          <p className="font-serif text-base text-secondary mb-5 leading-relaxed">
            {dish.description}
          </p>
        )}

        <div className="mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-[var(--accent-warm)]"></div>
            <span className="font-sans text-xs font-medium text-[var(--accent-warm)] tracking-[0.15em] uppercase">
              Contains
            </span>
          </div>
          <div className="bg-accent border-l-2 border-[var(--accent-warm)] pl-4 py-3">
            <ul className="font-sans text-sm text-secondary space-y-2">
              {dish.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[var(--accent-warm)] font-serif">•</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {dish.tags.map((tag, i) => (
              <span
                key={i}
                className="font-sans text-xs px-3 py-1 border border-subtle bg-primary text-tertiary tracking-wide"
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
      <div className="min-h-screen bg-primary grain-overlay flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-secondary border border-subtle rounded-sm shadow-[0_20px_60px_var(--shadow-medium)] p-12 text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[var(--accent-sage)] flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-4xl font-display font-semibold text-primary mb-4 tracking-tight">
            Thank You
          </h1>
          <div className="w-16 h-px bg-[var(--accent-sage)] mx-auto mb-6"></div>
          <p className="text-lg font-serif text-secondary mb-8 leading-relaxed max-w-lg mx-auto">
            Your selections have been recorded. We look forward to hosting you with care and intention.
          </p>
          <div className="bg-accent border border-subtle p-8 rounded-sm">
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              {event.title}
            </h2>
            <p className="font-sans text-secondary">
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
    <div className="min-h-screen bg-primary grain-overlay">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block mb-6">
            <span className="font-serif text-tertiary text-xs tracking-[0.3em] uppercase">
              Menu Selection
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-semibold text-primary mb-6 tracking-tight">
            {event.title}
          </h1>
          <div className="w-24 h-px bg-[var(--accent-earth)] mx-auto mb-6"></div>
          <p className="text-xl font-serif text-secondary mb-3">
            {new Date(event.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
          <p className="font-sans text-tertiary">
            Hello {guest.email}, please make your selections below
          </p>
        </div>

        <div className="space-y-20">
          {appetizers.length > 0 && (
            <section className="animate-fade-in-up stagger-1">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-px bg-[var(--accent-warm)]"></div>
                  <h2 className="text-4xl font-display font-semibold text-primary tracking-tight">
                    Starters
                  </h2>
                </div>
                <p className="font-sans text-secondary ml-16">
                  These starters will be served to all guests
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {appetizers.map((dish, index) => (
                  <div key={dish.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <DishCard dish={dish} category="appetizer" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {mains.length > 0 && (
            <section className="animate-fade-in-up stagger-2">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-px bg-[var(--accent-warm)]"></div>
                  <h2 className="text-4xl font-display font-semibold text-primary tracking-tight">
                    Main Courses
                  </h2>
                </div>
                <p className="font-sans text-secondary ml-16">
                  {event.main_selection_type === 'choose_one'
                    ? 'Please choose one main course'
                    : 'All main courses will be served'
                  }
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mains.map((dish, index) => (
                  <div
                    key={dish.id}
                    className={`cursor-pointer transition-all duration-500 animate-fade-in-up ${
                      event.main_selection_type === 'choose_one'
                        ? selectedMainId === dish.id
                          ? 'ring-4 ring-[var(--accent-warm)] ring-offset-4 ring-offset-[var(--bg-primary)]'
                          : 'opacity-60 hover:opacity-100'
                        : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
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
            <section className="animate-fade-in-up stagger-3">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-px bg-[var(--accent-warm)]"></div>
                  <h2 className="text-4xl font-display font-semibold text-primary tracking-tight">
                    Desserts
                  </h2>
                </div>
                <p className="font-sans text-secondary ml-16">
                  Vote for your favorite (optional) — the most popular will be served
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {desserts.map((dish, index) => (
                  <div
                    key={dish.id}
                    className={`cursor-pointer transition-all duration-500 animate-fade-in-up ${
                      selectedDessertId === dish.id
                        ? 'ring-4 ring-[var(--accent-warm)] ring-offset-4 ring-offset-[var(--bg-primary)]'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => setSelectedDessertId(prev => prev === dish.id ? null : dish.id)}
                  >
                    <DishCard dish={dish} category="dessert" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="mt-20 flex justify-center animate-fade-in-up stagger-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-sans px-12 py-5 bg-[var(--accent-forest)] text-white rounded-sm hover:bg-[var(--accent-earth)] transition-all duration-300 font-semibold text-lg shadow-[0_8px_24px_var(--shadow-soft)] disabled:opacity-50 tracking-wide"
          >
            {isSubmitting ? 'Submitting...' : 'Submit My Selections'}
          </button>
        </div>
      </div>
    </div>
  )
}
