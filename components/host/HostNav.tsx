'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import GroupSelector from './GroupSelector';

type Group = Database['public']['Tables']['groups']['Row'];
type GroupMember = Database['public']['Tables']['group_members']['Row'];
type GroupWithRole = Group & { role: GroupMember['role'] };

interface HostNavProps {
  user: User;
  groups?: GroupWithRole[];
  currentGroupId?: string;
}

export default function HostNav({
  user,
  groups,
  currentGroupId,
}: HostNavProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="bg-primary border-b border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/host" className="flex items-center gap-3 group">
              {/* Logo Icon */}
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--accent-earth)] text-white shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </span>
              <span className="font-display text-xl font-semibold text-primary tracking-tight">
                Table Mate
              </span>
            </Link>

            {/* Divider */}
            {groups && currentGroupId && groups.length > 1 && (
              <div className="h-6 w-px bg-subtle"></div>
            )}

            {groups && currentGroupId && (
              <GroupSelector groups={groups} currentGroupId={currentGroupId} />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/host/settings/groups"
              className="
                flex items-center gap-2 px-3 py-2 rounded-lg
                text-sm text-secondary
                hover:text-primary hover:bg-secondary
                transition-colors duration-150
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Groups</span>
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-2 border-l border-subtle ml-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-tertiary text-xs font-medium uppercase">
                  {user.email?.charAt(0)}
                </span>
                <span className="text-sm text-secondary max-w-[150px] truncate hidden sm:block">
                  {user.email}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="
                  flex items-center gap-2 px-3 py-2 rounded-lg
                  text-sm text-secondary
                  hover:text-[var(--accent-warm)] hover:bg-[var(--accent-warm)]/10
                  transition-colors duration-150
                "
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
