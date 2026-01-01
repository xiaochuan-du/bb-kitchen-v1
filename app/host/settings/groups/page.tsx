import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HostNav from '@/components/host/HostNav'
import Link from 'next/link'
import { getUserGroups } from '@/lib/supabase/groups'
import CreateGroupForm from '@/components/host/CreateGroupForm'

export default async function GroupsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const groups = await getUserGroups()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HostNav user={user} groups={groups} currentGroupId={groups[0]?.id} />
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
          Group Settings
        </h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Groups
            </h2>
            <div className="space-y-3">
              {groups.map(group => (
                <Link
                  key={group.id}
                  href={`/host/settings/groups/${group.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {group.name}
                        {group.is_personal && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            Personal
                          </span>
                        )}
                      </h3>
                      {group.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {group.role === 'owner' && 'Owner'}
                      {group.role === 'admin' && 'Admin'}
                      {group.role === 'member' && 'Member'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Group
            </h2>
            <CreateGroupForm />
          </div>
        </div>
      </main>
    </div>
  )
}
