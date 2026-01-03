'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import Image from 'next/image'

type Dish = Database['public']['Tables']['dishes']['Row']

export default function DishCard({
  dish,
  onDelete,
  onEdit,
}: {
  dish: Dish
  onDelete: (dishId: string) => void
  onEdit?: (dish: Dish) => void
}) {
  const [showIngredients, setShowIngredients] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!dish.image_url) {
        setSignedUrl(null)
        return
      }

      // Check if it's a full URL (legacy) or just a path
      if (dish.image_url.startsWith('http')) {
        setSignedUrl(dish.image_url)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('dish-images')
        .createSignedUrl(dish.image_url, 3600) // 1 hour expiry

      if (data) {
        setSignedUrl(data.signedUrl)
      } else {
        console.error('Error getting signed URL:', error)
      }
    }

    getSignedUrl()
  }, [dish.image_url])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dish?')) return

    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('dishes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', dish.id)

    if (!error) {
      onDelete(dish.id)
    } else {
      console.error('Error deleting dish:', error)
      setIsDeleting(false)
    }
  }

  const categoryLabel = {
    appetizer: 'Starter',
    main: 'Main Course',
    dessert: 'Dessert',
  }

  return (
    <div className="group bg-secondary border border-subtle rounded-sm overflow-hidden hover:shadow-[0_12px_30px_var(--shadow-soft)] transition-all duration-500">
      {signedUrl && (
        <div className="relative h-56 w-full bg-accent overflow-hidden">
          <Image
            src={signedUrl}
            alt={dish.name}
            fill
            unoptimized={signedUrl.includes('127.0.0.1')}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-serif text-xs tracking-[0.2em] uppercase text-[var(--accent-warm)]">
                {categoryLabel[dish.category]}
              </span>
            </div>
            <h3 className="font-display text-2xl font-semibold text-primary tracking-tight">
              {dish.name}
            </h3>
          </div>
          <div className="flex gap-3 mt-1">
            {onEdit && (
              <button
                onClick={() => onEdit(dish)}
                className="font-sans text-xs text-tertiary hover:text-[var(--accent-earth)] transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="font-sans text-xs text-tertiary hover:text-[var(--accent-warm)] transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {dish.description && (
          <p className="font-serif text-sm text-secondary mb-4 leading-relaxed">
            {dish.description}
          </p>
        )}

        {dish.recipe && (
          <div className="mb-4 p-4 bg-accent border-l-4 border-[var(--accent-earth)] rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[var(--accent-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-sans text-xs font-medium text-tertiary tracking-[0.1em] uppercase">
                Recipe / Notes (Host Only)
              </span>
            </div>
            <p className="font-sans text-sm text-secondary leading-relaxed whitespace-pre-wrap">
              {dish.recipe}
            </p>
          </div>
        )}

        {dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {dish.tags.map((tag, i) => (
              <span
                key={i}
                className="font-sans text-xs px-3 py-1 border border-subtle bg-accent text-tertiary tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowIngredients(!showIngredients)}
          className="font-sans text-sm text-[var(--accent-earth)] hover:text-[var(--accent-warm)] transition-colors border-b border-[var(--accent-earth)] hover:border-[var(--accent-warm)]"
        >
          {showIngredients ? 'Hide' : 'View'} Ingredients ({dish.ingredients.length})
        </button>

        {showIngredients && (
          <div className="mt-4 pt-4 border-t border-subtle">
            <p className="font-sans text-xs font-medium text-tertiary tracking-[0.1em] uppercase mb-3">
              Ingredients
            </p>
            <ul className="font-sans text-sm text-secondary space-y-2">
              {dish.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[var(--accent-warm)] mt-1">•</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
