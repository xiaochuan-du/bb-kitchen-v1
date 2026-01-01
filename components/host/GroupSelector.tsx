'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Database } from '@/types/database'

type Group = Database['public']['Tables']['groups']['Row']
type GroupMember = Database['public']['Tables']['group_members']['Row']

type GroupWithRole = Group & { role: GroupMember['role'] }

export default function GroupSelector({
  groups,
  currentGroupId,
}: {
  groups: GroupWithRole[]
  currentGroupId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleGroupChange = (groupId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('group', groupId)
    router.push(`/host?${params.toString()}`)
  }

  // Don't show selector if only one group
  if (groups.length <= 1) {
    return null
  }

  return (
    <div className="relative">
      <select
        value={currentGroupId}
        onChange={(e) => handleGroupChange(e.target.value)}
        className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {groups.map(group => (
          <option key={group.id} value={group.id}>
            {group.name}{group.is_personal ? ' (Personal)' : ''}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
