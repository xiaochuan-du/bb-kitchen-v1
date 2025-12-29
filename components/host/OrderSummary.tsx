'use client'

import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']
type Dish = Database['public']['Tables']['dishes']['Row']
type Guest = Database['public']['Tables']['guests']['Row']
type Selection = Database['public']['Tables']['selections']['Row']
type DessertVote = Database['public']['Tables']['dessert_votes']['Row']

export default function OrderSummary({
  event,
  dishes,
  guests,
  selections,
  votes,
}: {
  event: Event
  dishes: Dish[]
  guests: Guest[]
  selections: Selection[]
  votes: DessertVote[]
}) {
  const getDishById = (id: string) => dishes.find(d => d.id === id)

  const appetizers = event.appetizer_ids.map(getDishById).filter(Boolean) as Dish[]
  const mains = event.main_dish_ids.map(getDishById).filter(Boolean) as Dish[]
  const desserts = event.dessert_ids.map(getDishById).filter(Boolean) as Dish[]

  const respondedGuests = guests.filter(g => g.has_responded)
  const totalGuests = guests.length

  const mainSelectionCounts = event.main_selection_type === 'choose_one'
    ? mains.reduce((acc, dish) => {
        acc[dish.id] = selections.filter(s => s.selected_main_id === dish.id).length
        return acc
      }, {} as Record<string, number>)
    : {}

  const dessertVoteCounts = desserts.reduce((acc, dish) => {
    acc[dish.id] = votes.filter(v => v.dessert_id === dish.id).length
    return acc
  }, {} as Record<string, number>)

  const winningDessert = desserts.length > 0
    ? desserts.reduce((winner, dish) =>
        (dessertVoteCounts[dish.id] || 0) > (dessertVoteCounts[winner.id] || 0) ? dish : winner
      , desserts[0])
    : null

  const getAllIngredients = () => {
    const ingredientMap: Record<string, number> = {}

    appetizers.forEach(dish => {
      dish.ingredients.forEach(ing => {
        ingredientMap[ing] = totalGuests
      })
    })

    if (event.main_selection_type === 'choose_one') {
      mains.forEach(dish => {
        const count = mainSelectionCounts[dish.id] || 0
        dish.ingredients.forEach(ing => {
          ingredientMap[ing] = (ingredientMap[ing] || 0) + count
        })
      })
    } else {
      mains.forEach(dish => {
        dish.ingredients.forEach(ing => {
          ingredientMap[ing] = totalGuests
        })
      })
    }

    if (winningDessert) {
      winningDessert.ingredients.forEach(ing => {
        ingredientMap[ing] = totalGuests
      })
    }

    return Object.entries(ingredientMap)
      .sort(([a], [b]) => a.localeCompare(b))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Order Summary
      </h2>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700 dark:text-gray-300">Total Guests:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{totalGuests}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300">Responded:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {respondedGuests.length} / {totalGuests}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Appetizers (All Guests)
          </h3>
          <ul className="space-y-2">
            {appetizers.map(dish => (
              <li key={dish.id} className="text-sm text-gray-700 dark:text-gray-300">
                • {dish.name} × {totalGuests}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Main Courses
          </h3>
          {event.main_selection_type === 'choose_one' ? (
            <ul className="space-y-2">
              {mains.map(dish => (
                <li key={dish.id} className="text-sm text-gray-700 dark:text-gray-300">
                  • {dish.name} × {mainSelectionCounts[dish.id] || 0}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {mains.map(dish => (
                <li key={dish.id} className="text-sm text-gray-700 dark:text-gray-300">
                  • {dish.name} × {totalGuests}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Desserts (Voting Results)
          </h3>
          <ul className="space-y-2">
            {desserts.map(dish => {
              const voteCount = dessertVoteCounts[dish.id] || 0
              const isWinner = winningDessert?.id === dish.id
              return (
                <li key={dish.id} className={`text-sm ${isWinner ? 'font-semibold text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {isWinner && '🏆 '}• {dish.name} ({voteCount} votes)
                </li>
              )
            })}
          </ul>
          {winningDessert && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Winner will be served to all {totalGuests} guests
            </p>
          )}
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Shopping List
          </h3>
          {getAllIngredients().length > 0 ? (
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {getAllIngredients().map(([ingredient, count]) => (
                <li key={ingredient}>
                  • {ingredient} (for {count} {count === 1 ? 'person' : 'people'})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Waiting for guest responses to generate shopping list
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
