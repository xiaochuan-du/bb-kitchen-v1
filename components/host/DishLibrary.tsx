'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import DishCard from './DishCard'
import DishForm from './DishForm'

type Dish = Database['public']['Tables']['dishes']['Row']

export default function DishLibrary({ initialDishes }: { initialDishes: Dish[] }) {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'appetizer' | 'main' | 'dessert'>('all')

  const filteredDishes = filter === 'all'
    ? dishes
    : dishes.filter(d => d.category === filter)

  const handleDishCreated = (newDish: Dish) => {
    setDishes([newDish, ...dishes])
    setShowForm(false)
  }

  const handleDishDeleted = (dishId: string) => {
    setDishes(dishes.filter(d => d.id !== dishId))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dish Library
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {dishes.length} dishes total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
        >
          {showForm ? 'Cancel' : '+ Add Dish'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <DishForm onSuccess={handleDishCreated} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {['all', 'appetizer', 'main', 'dessert'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === cat
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onDelete={handleDishDeleted}
          />
        ))}
      </div>

      {filteredDishes.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all'
              ? 'No dishes yet. Add your first dish to get started!'
              : `No ${filter} dishes yet.`
            }
          </p>
        </div>
      )}
    </div>
  )
}
