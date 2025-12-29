import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DishLibrary from '@/components/host/DishLibrary'
import EventsList from '@/components/host/EventsList'
import HostNav from '@/components/host/HostNav'

export default async function HostDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: dishes } = await supabase
    .from('dishes')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HostNav user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Host Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your dishes and events
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DishLibrary initialDishes={dishes || []} />
          </div>
          <div>
            <EventsList initialEvents={events || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
