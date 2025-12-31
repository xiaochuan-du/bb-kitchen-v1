import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventForm from '@/components/host/EventForm'
import HostNav from '@/components/host/HostNav'
import Link from 'next/link'

export default async function NewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: dishes } = await supabase
    .from('dishes')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (!dishes || dishes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <HostNav user={user} />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create Some Dishes First
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to add dishes to your library before creating an event.
            </p>
            <Link
              href="/host"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HostNav user={user} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/host"
            className="text-orange-600 dark:text-orange-400 hover:underline text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Create New Event
        </h1>
        <EventForm dishes={dishes} />
      </main>
    </div>
  )
}
