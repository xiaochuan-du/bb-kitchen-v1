'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentGroup = groups.find(g => g.id === currentGroupId)

  const handleGroupChange = (groupId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('group', groupId)
    router.push(`/host?${params.toString()}`)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Don't show selector if only one group
  if (groups.length <= 1) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-3 px-4 py-2.5
          bg-secondary border border-subtle rounded-lg
          text-primary text-sm font-medium
          cursor-pointer
          hover:bg-accent hover:border-[var(--accent-earth)]/30
          focus:outline-none focus:ring-2 focus:ring-[var(--accent-earth)]/20 focus:border-[var(--accent-earth)]/50
          transition-all duration-200 ease-out
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Group Icon */}
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--accent-earth)]/10">
          {currentGroup?.is_personal ? (
            <svg className="w-3.5 h-3.5 text-[var(--accent-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-[var(--accent-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
        </span>

        {/* Group Name */}
        <span className="max-w-[160px] truncate">
          {currentGroup?.name}
        </span>

        {/* Personal Badge */}
        {currentGroup?.is_personal && (
          <span className="text-[10px] font-medium tracking-wide uppercase text-tertiary bg-accent px-1.5 py-0.5 rounded">
            Personal
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute left-0 top-full mt-2 z-50
            min-w-[280px] max-h-[320px] overflow-y-auto
            bg-primary border border-subtle rounded-xl
            shadow-[0_20px_50px_var(--shadow-medium),0_8px_16px_var(--shadow-soft)]
            animate-scale-in origin-top-left
          "
          role="listbox"
          aria-label="Select a group"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-subtle">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-tertiary">
              Switch Group
            </p>
          </div>

          {/* Options */}
          <div className="py-2">
            {groups.map(group => {
              const isSelected = group.id === currentGroupId

              return (
                <button
                  key={group.id}
                  onClick={() => handleGroupChange(group.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3
                    text-left cursor-pointer
                    transition-colors duration-150 ease-out
                    ${isSelected
                      ? 'bg-[var(--accent-earth)]/8'
                      : 'hover:bg-accent'
                    }
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Group Icon */}
                  <span className={`
                    flex items-center justify-center w-8 h-8 rounded-lg
                    ${isSelected
                      ? 'bg-[var(--accent-earth)]/15'
                      : 'bg-accent'
                    }
                  `}>
                    {group.is_personal ? (
                      <svg className={`w-4 h-4 ${isSelected ? 'text-[var(--accent-earth)]' : 'text-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className={`w-4 h-4 ${isSelected ? 'text-[var(--accent-earth)]' : 'text-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                  </span>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${isSelected ? 'text-[var(--accent-earth)]' : 'text-primary'}`}>
                        {group.name}
                      </span>
                      {group.is_personal && (
                        <span className="text-[10px] font-medium tracking-wide uppercase text-tertiary bg-accent px-1.5 py-0.5 rounded flex-shrink-0">
                          Personal
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-tertiary capitalize">
                      {group.role}
                    </span>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <svg className="w-5 h-5 text-[var(--accent-earth)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
