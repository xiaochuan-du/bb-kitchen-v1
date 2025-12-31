'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { canCreateEventsAndDishes } from '@/lib/auth/permissions'

type Dish = Database['public']['Tables']['dishes']['Row']

export default function DishForm({
  onSuccess,
  onCancel,
  initialDish = null,
  isEditMode = false,
}: {
  onSuccess: (dish: Dish) => void
  onCancel: () => void
  initialDish?: Dish | null
  isEditMode?: boolean
}) {
  const [name, setName] = useState(initialDish?.name || '')
  const [description, setDescription] = useState(initialDish?.description || '')
  const [recipe, setRecipe] = useState(initialDish?.recipe || '')
  const [category, setCategory] = useState<'appetizer' | 'main' | 'dessert'>(initialDish?.category || 'main')
  const [ingredients, setIngredients] = useState(initialDish?.ingredients.join('\n') || '')
  const [tags, setTags] = useState(initialDish?.tags.join(', ') || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const currentImageUrl = initialDish?.image_url

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be signed in to create dishes')
      setIsLoading(false)
      return
    }

    if (!canCreateEventsAndDishes(user.email)) {
      alert('You do not have permission to create dishes')
      setIsLoading(false)
      return
    }

    let imageUrl = currentImageUrl || null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(fileName, imageFile)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('dish-images')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    }

    const dishData = {
      name,
      description: description || null,
      recipe: recipe || null,
      category,
      ingredients: ingredients.split('\n').filter(i => i.trim()),
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      image_url: imageUrl,
    }

    let data, error

    if (isEditMode && initialDish) {
      // Update existing dish
      const result = await supabase
        .from('dishes')
        .update(dishData)
        .eq('id', initialDish.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Create new dish
      const result = await supabase
        .from('dishes')
        .insert({
          ...dishData,
          host_id: user.id,
        } as never)
        .select()
        .single()
      data = result.data
      error = result.error
    }

    setIsLoading(false)

    if (error || !data) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} dish:`, error)
      alert(`Error ${isEditMode ? 'updating' : 'creating'} dish. Please try again.`)
    } else {
      onSuccess(data)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {isEditMode ? 'Edit Dish' : 'Add New Dish'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dish Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="e.g., Grilled Salmon"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="appetizer">Appetizer</option>
            <option value="main">Main Course</option>
            <option value="dessert">Dessert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Brief description of the dish"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Guest-facing description visible on the menu
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Recipe / Cooking Notes
          </label>
          <textarea
            value={recipe}
            onChange={(e) => setRecipe(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Cooking instructions, preparation steps, or notes for yourself..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            For your eyes only - guests will not see this
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ingredients (one per line) *
          </label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            placeholder="Salmon&#10;Olive oil&#10;Garlic&#10;Lemon"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This is a safety feature - guests will see these ingredients
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="e.g., #Vegan, #Spicy, #SpringFestival"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dish Image
          </label>
          {currentImageUrl && !imageFile && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current image:</p>
              <img
                src={currentImageUrl}
                alt="Current dish"
                className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload a new image to replace</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
        >
          {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Dish' : 'Create Dish')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
