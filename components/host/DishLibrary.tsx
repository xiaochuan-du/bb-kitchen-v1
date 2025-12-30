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
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [filter, setFilter] = useState<'all' | 'appetizer' | 'main' | 'dessert'>('all')

  const filteredDishes = filter === 'all'
    ? dishes
    : dishes.filter(d => d.category === filter)

  const handleDishCreated = (newDish: Dish) => {
    setDishes([newDish, ...dishes])
    setShowForm(false)
  }

  const handleDishUpdated = (updatedDish: Dish) => {
    setDishes(dishes.map(d => d.id === updatedDish.id ? updatedDish : d))
    setEditingDish(null)
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
          disabled={editingDish !== null}
          className="font-sans px-6 py-3 bg-[#C17254] text-white rounded-sm hover:bg-[#8B7355] transition-all duration-300 font-medium text-sm tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showForm ? '✕ Cancel' : '+ Add Dish'}
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
            className={`font-sans px-5 py-2.5 rounded-sm text-sm font-medium transition-all duration-300 ${
              filter === cat
                ? 'bg-[#3D5540] text-white shadow-lg'
                : 'bg-secondary border border-subtle text-secondary hover:border-[#3D5540] hover:text-[#3D5540] hover:shadow-md'
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
            {editingDish?.id === dish.id ? (
              <DishForm
                initialDish={dish}
                isEditMode={true}
                onSuccess={handleDishUpdated}
                onCancel={() => setEditingDish(null)}
              />
            ) : (
              <DishCard
                dish={dish}
                onDelete={handleDishDeleted}
                onEdit={(dish) => setEditingDish(dish)}
              />
            )}
          </div>
        ))}
      </div>

      {filteredDishes.length === 0 && (
        <div className="relative text-center py-20 bg-secondary border-2 border-dashed border-subtle rounded-lg overflow-hidden group hover:border-[#9DAA97] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#9DAA97]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative max-w-sm mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#C17254]/10 to-[#9DAA97]/10 flex items-center justify-center">
              <div className="text-4xl">🍽️</div>
            </div>
            <p className="font-serif text-xl text-primary mb-2">
              {filter === 'all'
                ? 'Your culinary canvas awaits'
                : `No ${filter} dishes yet`
              }
            </p>
            <p className="font-sans text-sm text-tertiary">
              {filter === 'all'
                ? 'Add your first dish to begin building your collection'
                : `Add a ${filter} dish to get started`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
