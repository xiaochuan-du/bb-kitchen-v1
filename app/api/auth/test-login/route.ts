/**
 * Test login endpoint for E2E testing
 * Creates a session for any email address (development mode only)
 *
 * Usage: GET /api/auth/test-login?email=test@example.com
 */

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  // Get email from query params
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    )
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()

  // Create admin client with service role key
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // First, try to find existing user
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  let userId = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )?.id

  // If user doesn't exist, create them
  if (!userId) {
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: `Test User (${email.split('@')[0]})`,
        },
      })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    userId = newUser?.user?.id
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'Failed to get user ID' },
      { status: 500 }
    )
  }

  // Generate a session for this user
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error || !data.properties?.hashed_token) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate session' },
      { status: 400 }
    )
  }

  // Verify the token to create a real session
  const { data: sessionData, error: verifyError } =
    await supabaseAdmin.auth.verifyOtp({
      token_hash: data.properties.hashed_token,
      type: 'magiclink',
    })

  if (verifyError || !sessionData.session) {
    return NextResponse.json(
      { error: verifyError?.message || 'Failed to create session' },
      { status: 400 }
    )
  }

  // Create a server client to properly set the session cookies
  const response = NextResponse.redirect(new URL('/host', request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Set the session using the Supabase client
  await supabase.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  })

  return response
}
