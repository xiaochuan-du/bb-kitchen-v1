import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Allowed host emails (comma-separated in env var, or defaults for production)
const ALLOWED_HOST_EMAILS = process.env.ALLOWED_HOST_EMAILS
  ? process.env.ALLOWED_HOST_EMAILS.split(',').map(e => e.trim().toLowerCase())
  : ['dxiaochuan@gmail.com', 'yang.niceday@gmail.com']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isHostRoute = request.nextUrl.pathname.startsWith('/host')

  // Redirect unauthenticated users trying to access protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/guest') &&
    !request.nextUrl.pathname.startsWith('/api/auth') &&
    isHostRoute
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Check if authenticated user is allowed to access host routes
  if (user && isHostRoute) {
    const userEmail = user.email?.toLowerCase()
    // Allow all hosts in development mode with ALLOW_ALL_HOSTS=true (for E2E testing)
    const allowAllHosts =
      process.env.NODE_ENV === 'development' &&
      process.env.ALLOW_ALL_HOSTS === 'true'

    if (!allowAllHosts && (!userEmail || !ALLOWED_HOST_EMAILS.includes(userEmail))) {
      // Sign out the unauthorized user and redirect to home
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
