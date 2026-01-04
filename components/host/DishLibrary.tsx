'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import DishCard from './DishCard'
import DishForm from './DishForm'

type Dish = Database['public']['Tables']['dishes']['Row']

const DISHES_PER_PAGE = 10

interface DishLibraryProps {
  initialDishes: Dish[]
  groupId: string
}

export default function DishLibrary({ initialDishes, groupId }: DishLibraryProps) {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes)
  const [showForm, setShowForm] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [filter, setFilter] = useState<'all' | 'appetizer' | 'main' | 'dessert'>('all')
  const [visibleCount, setVisibleCount] = useState(DISHES_PER_PAGE)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const filteredDishes = filter === 'all'
    ? dishes
    : dishes.filter(d => d.category === filter)

  const visibleDishes = filteredDishes.slice(0, visibleCount)
  const hasMoreDishes = visibleCount < filteredDishes.length

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(DISHES_PER_PAGE)
  }, [filter])

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + DISHES_PER_PAGE)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
            {visibleDishes.length} of {filteredDishes.length} {filteredDishes.length === 1 ? 'dish' : 'dishes'}
            {filter !== 'all' && ` (${filter})`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={editingDish !== null}
          className="
            flex items-center gap-2
            font-sans px-5 py-2.5
            bg-[var(--accent-warm)] text-white rounded-lg
            hover:bg-[var(--accent-earth)]
            transition-all duration-200
            font-medium text-sm
            shadow-sm hover:shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
          "
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Dish
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 animate-scale-in">
          <DishForm onSuccess={handleDishCreated} onCancel={() => setShowForm(false)} groupId={groupId} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8">
        {['all', 'appetizer', 'main', 'dessert'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as typeof filter)}
            className={`
              font-sans px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${filter === cat
                ? 'bg-[var(--accent-forest)] text-white shadow-sm'
                : 'bg-secondary border border-subtle text-secondary hover:border-[var(--accent-forest)]/40 hover:text-[var(--accent-forest)]'
              }
            `}
          >
            {cat === 'all' ? 'All Dishes' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleDishes.map((dish, index) => (
          <div
            key={dish.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${Math.min(index, 9) * 0.05}s` }}
          >
            {editingDish?.id === dish.id ? (
              <DishForm
                initialDish={dish}
                isEditMode={true}
                onSuccess={handleDishUpdated}
                onCancel={() => setEditingDish(null)}
                groupId={groupId}
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

      {hasMoreDishes && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            className="
              font-sans px-6 py-2.5
              bg-secondary border border-subtle text-secondary rounded-lg
              hover:border-[var(--accent-forest)]/40 hover:text-[var(--accent-forest)]
              transition-all duration-200
              font-medium text-sm
              cursor-pointer
            "
          >
            Load More ({filteredDishes.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {filteredDishes.length === 0 && (
        <div className="relative text-center py-16 bg-secondary border-2 border-dashed border-subtle rounded-xl overflow-hidden group hover:border-[var(--accent-sage)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-sage)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative max-w-sm mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--accent-earth)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="font-display text-xl text-primary mb-2">
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

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="
            fixed bottom-8 right-8 w-12 h-12
            bg-[var(--accent-forest)] text-white rounded-full
            shadow-lg hover:shadow-xl
            transition-all duration-200
            hover:-translate-y-0.5
            flex items-center justify-center z-50
            cursor-pointer
          "
          aria-label="Back to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
