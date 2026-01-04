'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DeleteGroupButtonProps {
  groupId: string
  groupName: string
}

export default function DeleteGroupButton({ groupId, groupName }: DeleteGroupButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false)
        setConfirmText('')
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [showModal])

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      console.error('Error deleting group:', error)
      setIsDeleting(false)
      return
    }

    router.push('/host/settings/groups')
    router.refresh()
  }

  const isConfirmValid = confirmText.toLowerCase() === 'delete'

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="
          flex items-center gap-2 px-4 py-2.5
          bg-[var(--accent-warm)]/10 text-[var(--accent-warm)]
          border border-[var(--accent-warm)]/20
          rounded-lg font-medium text-sm
          hover:bg-[var(--accent-warm)]/20 hover:border-[var(--accent-warm)]/40
          transition-colors duration-150
          cursor-pointer
        "
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete Group
      </button>

      {/* Modal Backdrop */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setShowModal(false)
            setConfirmText('')
          }}
        >
          {/* Modal Content */}
          <div
            className="
              w-full max-w-md
              bg-primary border border-subtle rounded-xl
              shadow-[0_25px_60px_var(--shadow-medium)]
              animate-scale-in
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-warm)]/10 flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--accent-warm)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-xl font-semibold text-primary">
                    Delete Group
                  </h3>
                  <p className="mt-2 text-sm text-secondary leading-relaxed">
                    Are you sure you want to delete <span className="font-medium text-primary">&ldquo;{groupName}&rdquo;</span>?
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="mx-6 p-4 bg-[var(--accent-warm)]/5 border border-[var(--accent-warm)]/20 rounded-lg">
              <p className="text-sm text-secondary leading-relaxed">
                This will permanently delete:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-secondary">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)]"></span>
                  All dishes in this group
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)]"></span>
                  All events and guest data
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)]"></span>
                  All member associations
                </li>
              </ul>
              <p className="mt-3 text-xs font-medium text-[var(--accent-warm)]">
                This action cannot be undone.
              </p>
            </div>

            {/* Confirm Input */}
            <div className="px-6 pt-4">
              <label className="block text-sm font-medium text-secondary mb-2">
                Type <span className="font-mono bg-accent px-1.5 py-0.5 rounded text-primary">delete</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                className="
                  w-full px-4 py-2.5
                  bg-secondary border border-subtle rounded-lg
                  text-primary text-sm placeholder:text-tertiary
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent-warm)]/20 focus:border-[var(--accent-warm)]/50
                  transition-colors duration-150
                "
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-6 py-5">
              <button
                onClick={() => {
                  setShowModal(false)
                  setConfirmText('')
                }}
                className="
                  flex-1 px-4 py-2.5
                  bg-secondary border border-subtle rounded-lg
                  text-primary text-sm font-medium
                  hover:bg-accent
                  transition-colors duration-150
                  cursor-pointer
                "
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!isConfirmValid || isDeleting}
                className="
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                  bg-[var(--accent-warm)] text-white rounded-lg
                  text-sm font-medium
                  hover:bg-[#A85E45]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors duration-150
                  cursor-pointer
                "
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
