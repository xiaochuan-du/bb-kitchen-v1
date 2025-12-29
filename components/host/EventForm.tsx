'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'
import { canCreateEventsAndDishes } from '@/lib/auth/permissions'

type Dish = Database['public']['Tables']['dishes']['Row']

export default function EventForm({ dishes }: { dishes: Dish[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAppetizers, setSelectedAppetizers] = useState<string[]>([])
  const [selectedMains, setSelectedMains] = useState<string[]>([])
  const [selectedDesserts, setSelectedDesserts] = useState<string[]>([])
  const [mainSelectionType, setMainSelectionType] = useState<'choose_one' | 'fixed'>('choose_one')
  const [isLoading, setIsLoading] = useState(false)

  const appetizers = dishes.filter(d => d.category === 'appetizer')
  const mains = dishes.filter(d => d.category === 'main')
  const desserts = dishes.filter(d => d.category === 'dessert')

  const toggleDish = (dishId: string, category: 'appetizer' | 'main' | 'dessert') => {
    const setters = {
      appetizer: setSelectedAppetizers,
      main: setSelectedMains,
      dessert: setSelectedDesserts,
    }
    const getters = {
      appetizer: selectedAppetizers,
      main: selectedMains,
      dessert: selectedDesserts,
    }

    const setter = setters[category]
    const current = getters[category]

    if (current.includes(dishId)) {
      setter(current.filter(id => id !== dishId))
    } else {
      setter([...current, dishId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be signed in')
      setIsLoading(false)
      return
    }

    if (!canCreateEventsAndDishes(user.email)) {
      alert('You do not have permission to create events')
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        host_id: user.id,
        title,
        event_date: new Date(eventDate).toISOString(),
        description: description || null,
        status: 'draft' as const,
        appetizer_ids: selectedAppetizers,
        main_dish_ids: selectedMains,
        dessert_ids: selectedDesserts,
        main_selection_type: mainSelectionType,
      } as any)
      .select()
      .single()

    setIsLoading(false)

    if (error) {
      console.error('Error creating event:', error)
      alert('Error creating event. Please try again.')
    } else if (data) {
      router.push(`/host/events/${(data as any).id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Event Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Spring Dinner Party"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Date & Time *
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Optional details about the event"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Menu Configuration
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Select which dishes will be available for this event
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Appetizers (Fixed Menu)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              All selected appetizers will be served to everyone
            </p>
            <div className="space-y-2">
              {appetizers.map(dish => (
                <label key={dish.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAppetizers.includes(dish.id)}
                    onChange={() => toggleDish(dish.id, 'appetizer')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span className="text-gray-900 dark:text-white">{dish.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Main Courses
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selection Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  style={{
                    borderColor: mainSelectionType === 'choose_one' ? '#f97316' : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="mainType"
                    value="choose_one"
                    checked={mainSelectionType === 'choose_one'}
                    onChange={() => setMainSelectionType('choose_one')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Guest Choice (Recommended)
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Guests choose one main course option
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  style={{
                    borderColor: mainSelectionType === 'fixed' ? '#f97316' : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="mainType"
                    value="fixed"
                    checked={mainSelectionType === 'fixed'}
                    onChange={() => setMainSelectionType('fixed')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Fixed Menu
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Everyone gets the same main course
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              {mains.map(dish => (
                <label key={dish.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMains.includes(dish.id)}
                    onChange={() => toggleDish(dish.id, 'main')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span className="text-gray-900 dark:text-white">{dish.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Desserts (Democratic Voting)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Guests will vote for their favorite. The most popular choice will be served to everyone.
            </p>
            <div className="space-y-2">
              {desserts.map(dish => (
                <label key={dish.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDesserts.includes(dish.id)}
                    onChange={() => toggleDish(dish.id, 'dessert')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span className="text-gray-900 dark:text-white">{dish.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
        >
          {isLoading ? 'Creating Event...' : 'Create Event'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
