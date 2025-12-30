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
        <div className="mb-16 animate-fade-in-up relative">
          <div className="flex items-start gap-6 mb-6">
            <div className="flex-shrink-0 w-1.5 h-20 bg-gradient-to-b from-[var(--accent-warm)] to-[var(--accent-forest)] rounded-full"></div>
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-display font-semibold text-primary tracking-tight mb-3">
                Host Dashboard
              </h1>
              <p className="font-sans text-lg text-secondary max-w-2xl">
                Manage your culinary collection and upcoming events
              </p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-[var(--accent-warm)]/20 via-[var(--accent-warm)]/40 to-transparent mt-8"></div>
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
