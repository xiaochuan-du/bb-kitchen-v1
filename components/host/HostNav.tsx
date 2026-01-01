'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import GroupSelector from './GroupSelector'

type Group = Database['public']['Tables']['groups']['Row']
type GroupMember = Database['public']['Tables']['group_members']['Row']
type GroupWithRole = Group & { role: GroupMember['role'] }

interface HostNavProps {
  user: User
  groups?: GroupWithRole[]
  currentGroupId?: string
}

export default function HostNav({ user, groups, currentGroupId }: HostNavProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link href="/host" className="flex items-center gap-2">
              <span className="text-2xl">🍳</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Table Mate
              </span>
            </Link>
            {groups && currentGroupId && (
              <GroupSelector groups={groups} currentGroupId={currentGroupId} />
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/host/settings/groups"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              Groups
            </Link>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
