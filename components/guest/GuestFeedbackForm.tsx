'use client'

import { useState } from 'react'
import { submitGuestFeedback } from '@/app/guest/actions'
import type { Database } from '@/types/database'
import Image from 'next/image'

type Event = Database['public']['Tables']['events']['Row']
type Dish = Database['public']['Tables']['dishes']['Row']
type Guest = Database['public']['Tables']['guests']['Row']
type DishFeedback = Database['public']['Tables']['dish_feedback']['Row']
type EventFeedback = Database['public']['Tables']['event_feedback']['Row']

type DishFeedbackState = {
  rating: 'up' | 'down' | null
  comment: string
}

export default function GuestFeedbackForm({
  event,
  dishes,
  guest,
  existingDishFeedback,
  existingEventFeedback,
}: {
  event: Event
  dishes: Dish[]
  guest: Guest
  existingDishFeedback: DishFeedback[]
  existingEventFeedback: EventFeedback | null
}) {
  const getDishById = (id: string) => dishes.find(d => d.id === id)

  const appetizers = event.appetizer_ids.map(getDishById).filter(Boolean) as Dish[]
  const mains = event.main_dish_ids.map(getDishById).filter(Boolean) as Dish[]
  const desserts = event.dessert_ids.map(getDishById).filter(Boolean) as Dish[]
  const allDishes = [...appetizers, ...mains, ...desserts]

  // Initialize feedback state from existing feedback
  const initialFeedback: Record<string, DishFeedbackState> = {}
  allDishes.forEach(dish => {
    const existing = existingDishFeedback.find(f => f.dish_id === dish.id)
    initialFeedback[dish.id] = {
      rating: existing?.rating || null,
      comment: existing?.comment || '',
    }
  })

  const [dishFeedback, setDishFeedback] = useState<Record<string, DishFeedbackState>>(initialFeedback)
  const [eventComment, setEventComment] = useState(existingEventFeedback?.comment || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(guest.has_submitted_feedback)

  const handleRatingChange = (dishId: string, rating: 'up' | 'down') => {
    setDishFeedback(prev => ({
      ...prev,
      [dishId]: {
        ...prev[dishId],
        rating: prev[dishId]?.rating === rating ? null : rating,
      }
    }))
  }

  const handleCommentChange = (dishId: string, comment: string) => {
    setDishFeedback(prev => ({
      ...prev,
      [dishId]: {
        ...prev[dishId],
        comment,
      }
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const feedbackItems = Object.entries(dishFeedback)
        .filter(([_, feedback]) => feedback.rating !== null)
        .map(([dishId, feedback]) => ({
          dishId,
          rating: feedback.rating as 'up' | 'down',
          comment: feedback.comment || null,
        }))

      await submitGuestFeedback({
        guestId: guest.id,
        eventId: event.id,
        magicToken: guest.magic_token,
        dishFeedback: feedbackItems,
        eventComment: eventComment || null,
      })
      setHasSubmitted(true)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Error submitting your feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const DishFeedbackCard = ({ dish, category }: { dish: Dish; category: string }) => {
    const feedback = dishFeedback[dish.id] || { rating: null, comment: '' }

    return (
      <div className="group bg-secondary border border-subtle rounded-sm overflow-hidden shadow-[0_8px_24px_var(--shadow-soft)] transition-all duration-500">
        {dish.image_url && (
          <div className="relative h-48 w-full bg-accent overflow-hidden">
            <Image
              src={dish.image_url}
              alt={dish.name}
              fill
              unoptimized={dish.image_url.includes('127.0.0.1')}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        )}
        <div className="p-5">
          <h3 className="text-xl font-display font-semibold text-primary mb-2 tracking-tight">
            {dish.name}
          </h3>
          <span className="inline-block font-sans text-xs px-2 py-1 bg-accent text-tertiary mb-4 capitalize">
            {category}
          </span>

          <div className="flex items-center gap-3 mb-4">
            <span className="font-sans text-sm text-secondary">Rate this dish:</span>
            <button
              type="button"
              onClick={() => handleRatingChange(dish.id, 'up')}
              className={`p-2 rounded-sm transition-all duration-300 ${
                feedback.rating === 'up'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 ring-2 ring-green-500'
                  : 'bg-accent text-tertiary hover:bg-green-50 dark:hover:bg-green-900/30'
              }`}
              aria-label="Thumbs up"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleRatingChange(dish.id, 'down')}
              className={`p-2 rounded-sm transition-all duration-300 ${
                feedback.rating === 'down'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 ring-2 ring-red-500'
                  : 'bg-accent text-tertiary hover:bg-red-50 dark:hover:bg-red-900/30'
              }`}
              aria-label="Thumbs down"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
              </svg>
            </button>
          </div>

          <textarea
            value={feedback.comment}
            onChange={(e) => handleCommentChange(dish.id, e.target.value)}
            placeholder="Add a comment (optional)"
            className="w-full px-3 py-2 border border-subtle rounded-sm bg-primary text-primary placeholder-tertiary font-sans text-sm resize-none focus:ring-2 focus:ring-[var(--accent-warm)] focus:border-transparent transition-all"
            rows={2}
          />
        </div>
      </div>
    )
  }

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
            Thank You for Your Feedback
          </h1>
          <div className="w-16 h-px bg-[var(--accent-sage)] mx-auto mb-6"></div>
          <p className="text-lg font-serif text-secondary mb-8 leading-relaxed max-w-lg mx-auto">
            Your feedback has been recorded. It helps us create even better dining experiences.
          </p>
          <div className="bg-accent border border-subtle p-8 rounded-sm">
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              {event.title}
            </h2>
            <p className="font-sans text-secondary">
              We hope to see you again soon!
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
              Share Your Thoughts
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-semibold text-primary mb-6 tracking-tight">
            How Was Everything?
          </h1>
          <div className="w-24 h-px bg-[var(--accent-earth)] mx-auto mb-6"></div>
          <p className="text-xl font-serif text-secondary mb-3">
            Thank you for attending {event.title}
          </p>
          <p className="font-sans text-tertiary max-w-2xl mx-auto">
            We would love to hear your feedback on the dishes. Your thoughts help us improve and create better experiences.
          </p>
        </div>

        <div className="space-y-16">
          {appetizers.length > 0 && (
            <section className="animate-fade-in-up stagger-1">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-px bg-[var(--accent-warm)]"></div>
                  <h2 className="text-3xl font-display font-semibold text-primary tracking-tight">
                    Starters
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appetizers.map((dish, index) => (
                  <div key={dish.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <DishFeedbackCard dish={dish} category="appetizer" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {mains.length > 0 && (
            <section className="animate-fade-in-up stagger-2">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-px bg-[var(--accent-warm)]"></div>
                  <h2 className="text-3xl font-display font-semibold text-primary tracking-tight">
                    Main Courses
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mains.map((dish, index) => (
                  <div key={dish.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <DishFeedbackCard dish={dish} category="main" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {desserts.length > 0 && (
            <section className="animate-fade-in-up stagger-3">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-px bg-[var(--accent-warm)]"></div>
                  <h2 className="text-3xl font-display font-semibold text-primary tracking-tight">
                    Desserts
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {desserts.map((dish, index) => (
                  <div key={dish.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <DishFeedbackCard dish={dish} category="dessert" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="animate-fade-in-up stagger-4">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-px bg-[var(--accent-warm)]"></div>
                <h2 className="text-3xl font-display font-semibold text-primary tracking-tight">
                  Overall Experience
                </h2>
              </div>
            </div>
            <div className="max-w-2xl">
              <textarea
                value={eventComment}
                onChange={(e) => setEventComment(e.target.value)}
                placeholder="Share any additional thoughts about the event (optional)"
                className="w-full px-4 py-3 border border-subtle rounded-sm bg-secondary text-primary placeholder-tertiary font-sans text-base resize-none focus:ring-2 focus:ring-[var(--accent-warm)] focus:border-transparent transition-all"
                rows={4}
              />
            </div>
          </section>
        </div>

        <div className="mt-16 flex justify-center animate-fade-in-up stagger-5">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-sans px-12 py-5 bg-[var(--accent-forest)] text-white rounded-sm hover:bg-[var(--accent-earth)] transition-all duration-300 font-semibold text-lg shadow-[0_8px_24px_var(--shadow-soft)] disabled:opacity-50 tracking-wide"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
