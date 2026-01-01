import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DishLibrary from '@/components/host/DishLibrary'
import EventsList from '@/components/host/EventsList'
import HostNav from '@/components/host/HostNav'
import { getUserGroups, getActiveGroup } from '@/lib/supabase/groups'

export default async function HostDashboard({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const { group: groupParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Get user's groups and active group
  let groups: Awaited<ReturnType<typeof getUserGroups>> = []
  let activeGroup: Awaited<ReturnType<typeof getActiveGroup>> = null
  let migrationNeeded = false

  try {
    groups = await getUserGroups()
    activeGroup = await getActiveGroup(groupParam)
  } catch (error) {
    // Groups table may not exist yet - migration needed
    console.error('Error fetching groups:', error)
    migrationNeeded = true
  }

  if (!activeGroup && !migrationNeeded) {
    // Groups table exists but user has no groups - this shouldn't happen
    migrationNeeded = true
  }

  // If migration is needed, show a message
  if (migrationNeeded || !activeGroup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Database Migration Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The group-based authorization migration needs to be applied.
            Please run migration <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">06_add_groups.sql</code> in your Supabase SQL Editor.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            After running the migration, refresh this page.
          </p>
        </div>
      </div>
    )
  }

  // Fetch dishes for the active group
  const { data: dishes } = await supabase
    .from('dishes')
    .select('*')
    .eq('group_id', activeGroup.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Fetch events for the active group
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('group_id', activeGroup.id)
    .order('event_date', { ascending: false })

  return (
    <div className="min-h-screen bg-primary">
      <HostNav user={user} groups={groups} currentGroupId={activeGroup.id} />

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
            <DishLibrary initialDishes={dishes || []} groupId={activeGroup.id} />
          </div>
          <div className="animate-fade-in-up stagger-2">
            <EventsList initialEvents={events || []} groupId={activeGroup.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
