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
    <div className="min-h-screen bg-primary">
      <HostNav user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-2 h-16 bg-[var(--accent-warm)]"></div>
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-semibold text-primary tracking-tight">
                Host Dashboard
              </h1>
              <p className="font-sans text-secondary mt-2">
                Manage your culinary collection and upcoming events
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 animate-fade-in-up stagger-1">
            <DishLibrary initialDishes={dishes || []} />
          </div>
          <div className="animate-fade-in-up stagger-2">
            <EventsList initialEvents={events || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
