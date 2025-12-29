import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthButton from '@/components/AuthButton'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/host')
  }

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          The Guest Kitchen
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
          Curated menu experiences for hosting with care
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-xl mx-auto">
          Replace back-and-forth messaging with a visual menu experience.
          Manage dietary preferences safely and efficiently.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            For Hosts
          </h2>
          <ul className="text-left space-y-3 text-gray-700 dark:text-gray-300 mb-8">
            <li className="flex items-start">
              <span className="text-orange-500 mr-2 text-xl">✓</span>
              <span>Build your dish library with images and ingredients</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-2 text-xl">✓</span>
              <span>Create events with smart menu logic</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-2 text-xl">✓</span>
              <span>Send magic links to guests via email</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-2 text-xl">✓</span>
              <span>Get a complete shopping list 48 hours before</span>
            </li>
          </ul>

          <div className="flex flex-col gap-4">
            <AuthButton />
            {isDev && (
              <Link
                href="/api/auth/dev-login"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-all"
              >
                Dev Login (dxiaochuan@gmail.com)
              </Link>
            )}
          </div>
        </div>

        <div className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
          <p className="font-semibold">For Guests:</p>
          <p>You'll receive a magic link to view the menu and make your selections.</p>
          <p>No account needed - just use your Google ID to RSVP.</p>
        </div>
      </div>
    </div>
  )
}
