'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import Image from 'next/image'

type Dish = Database['public']['Tables']['dishes']['Row']

export default function DishCard({
  dish,
  onDelete,
}: {
  dish: Dish
  onDelete: (dishId: string) => void
}) {
  const [showIngredients, setShowIngredients] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dish?')) return

    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dish.id)

    if (!error) {
      onDelete(dish.id)
    } else {
      console.error('Error deleting dish:', error)
      setIsDeleting(false)
    }
  }

  const categoryEmoji = {
    appetizer: '🥗',
    main: '🍽️',
    dessert: '🍰',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
      {dish.image_url && (
        <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700">
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{categoryEmoji[dish.category]}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {dish.name}
              </h3>
            </div>
            <span className="inline-block text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
              {dish.category}
            </span>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {dish.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {dish.description}
          </p>
        )}

        {dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
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

        <button
          onClick={() => setShowIngredients(!showIngredients)}
          className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
        >
          {showIngredients ? 'Hide' : 'Show'} Ingredients ({dish.ingredients.length})
        </button>

        {showIngredients && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Ingredients:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {dish.ingredients.map((ing, i) => (
                <li key={i}>• {ing}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
