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
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-display font-semibold text-primary tracking-tight mb-2">
            Dish Library
          </h2>
          <p className="font-sans text-sm text-tertiary">
            {dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'} in your collection
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-sans px-6 py-3 bg-[var(--accent-forest)] text-white rounded-sm hover:bg-[var(--accent-earth)] transition-all duration-300 font-medium text-sm tracking-wide shadow-[0_4px_12px_var(--shadow-soft)]"
        >
          {showForm ? 'Cancel' : '+ Add Dish'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 animate-scale-in">
          <DishForm onSuccess={handleDishCreated} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        {['all', 'appetizer', 'main', 'dessert'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as typeof filter)}
            className={`font-sans px-5 py-2 rounded-sm text-sm font-medium transition-all duration-300 ${
              filter === cat
                ? 'bg-[var(--accent-warm)] text-white shadow-[0_4px_12px_var(--shadow-soft)]'
                : 'bg-secondary border border-subtle text-secondary hover:border-[var(--accent-warm)] hover:text-[var(--accent-warm)]'
            }`}
          >
            {cat === 'all' ? 'All Dishes' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDishes.map((dish, index) => (
          <div
            key={dish.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <DishCard
              dish={dish}
              onDelete={handleDishDeleted}
            />
          </div>
        ))}
      </div>

      {filteredDishes.length === 0 && (
        <div className="text-center py-20 bg-secondary border border-subtle rounded-sm">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-px bg-[var(--accent-sage)] mx-auto mb-6"></div>
            <p className="font-serif text-lg text-secondary">
              {filter === 'all'
                ? 'No dishes yet. Add your first dish to begin building your collection.'
                : `No ${filter} dishes in your library yet.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
