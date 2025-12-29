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
    <div className="min-h-screen bg-primary grain-overlay flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in-up">
          <div className="mb-8">
            <div className="inline-block mb-6">
              <span className="font-serif text-tertiary text-sm tracking-[0.3em] uppercase">
                Curated Hosting
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-semibold text-primary mb-8 tracking-tight">
              The Guest
              <br />
              Kitchen
            </h1>
          </div>

          <p className="text-xl md:text-2xl font-serif text-secondary mb-6 max-w-2xl mx-auto leading-relaxed">
            Thoughtful menu experiences for hosting with intention
          </p>

          <p className="text-base font-sans text-tertiary max-w-xl mx-auto leading-relaxed">
            Replace endless messaging with an elegant visual menu experience.
            <br className="hidden md:block" />
            Manage dietary considerations with grace and precision.
          </p>
        </div>

        <div className="section-divider"></div>

        {/* For Hosts Section */}
        <div className="bg-secondary border border-subtle rounded-sm shadow-[0_8px_30px_var(--shadow-soft)] p-10 md:p-16 mb-16 animate-fade-in-up stagger-2">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-primary mb-4">
              For Hosts
            </h2>
            <div className="w-16 h-px bg-[var(--accent-earth)] mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-3xl mx-auto">
            <div className="space-y-6 animate-slide-in-right stagger-3">
              <div className="flex items-start gap-4">
                <div className="w-1 h-12 bg-[var(--accent-warm)] mt-1 shrink-0"></div>
                <div>
                  <h3 className="font-sans font-semibold text-primary mb-1">Build Your Library</h3>
                  <p className="font-sans text-sm text-secondary leading-relaxed">
                    Curate dishes with images, ingredients, and detailed notes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-1 h-12 bg-[var(--accent-warm)] mt-1 shrink-0"></div>
                <div>
                  <h3 className="font-sans font-semibold text-primary mb-1">Smart Menu Logic</h3>
                  <p className="font-sans text-sm text-secondary leading-relaxed">
                    Create events with intelligent menu composition
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 animate-slide-in-right stagger-4">
              <div className="flex items-start gap-4">
                <div className="w-1 h-12 bg-[var(--accent-warm)] mt-1 shrink-0"></div>
                <div>
                  <h3 className="font-sans font-semibold text-primary mb-1">Seamless Invitations</h3>
                  <p className="font-sans text-sm text-secondary leading-relaxed">
                    Send elegant magic links directly to your guests
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-1 h-12 bg-[var(--accent-warm)] mt-1 shrink-0"></div>
                <div>
                  <h3 className="font-sans font-semibold text-primary mb-1">Shopping Automation</h3>
                  <p className="font-sans text-sm text-secondary leading-relaxed">
                    Receive a complete shopping list 48 hours in advance
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 max-w-md mx-auto animate-scale-in stagger-5">
            <AuthButton />
            {isDev && (
              <Link
                href="/api/auth/dev-login"
                className="inline-flex items-center justify-center gap-2 bg-[var(--accent-forest)] text-white px-8 py-4 rounded-sm text-base font-sans font-medium hover:bg-[var(--accent-earth)] transition-all duration-300 shadow-[0_4px_12px_var(--shadow-soft)]"
              >
                Dev Login (dxiaochuan@gmail.com)
              </Link>
            )}
          </div>
        </div>

        {/* For Guests Section */}
        <div className="text-center bg-accent border border-subtle rounded-sm p-10 md:p-12 animate-fade-in-up stagger-6">
          <h2 className="text-2xl font-display font-semibold text-primary mb-4">
            For Guests
          </h2>
          <div className="w-12 h-px bg-[var(--accent-sage)] mx-auto mb-6"></div>
          <p className="font-sans text-secondary leading-relaxed max-w-lg mx-auto">
            Receive a personalized magic link to view the menu and make your selections.
          </p>
          <p className="font-sans text-tertiary text-sm mt-3">
            No account required — authenticate seamlessly with your Google ID
          </p>
        </div>
      </div>
    </div>
  )
}
