'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']
type Guest = Database['public']['Tables']['guests']['Row']

export default function FeedbackEmailContent({
  event,
  guest,
  eventId,
}: {
  event: Event
  guest: Guest
  eventId: string
}) {
  const [copied, setCopied] = useState(false)

  const feedbackLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/guest/${eventId}/feedback?token=${guest.magic_token}`

  const emailSubject = `Thank you for attending ${event.title}!`

  const emailBody = `Dear Guest,

Thank you so much for joining us at ${event.title}! We hope you had a wonderful time and enjoyed the food.

We would love to hear your thoughts on the dishes we served. Your feedback helps us create even better dining experiences in the future.

Please take a moment to share your feedback:
${feedbackLink}

It only takes a minute, and we truly appreciate your input!

Warm regards,
Your Host`

  const copyEmailContent = () => {
    const fullContent = `Subject: ${emailSubject}\n\n${emailBody}`
    navigator.clipboard.writeText(fullContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyFeedbackLink = () => {
    navigator.clipboard.writeText(feedbackLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 text-sm">
          Feedback Survey Link
        </h4>
        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3 break-all font-mono">
          {feedbackLink}
        </p>
        <div className="flex gap-2">
          <button
            onClick={copyFeedbackLink}
            className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={copyEmailContent}
            className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition"
          >
            Copy Full Email
          </button>
        </div>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          Preview email content
        </summary>
        <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-xs overflow-auto max-h-48">
          {`Subject: ${emailSubject}\n\n${emailBody}`}
        </pre>
      </details>
    </div>
  )
}
