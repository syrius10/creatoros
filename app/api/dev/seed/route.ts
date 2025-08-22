import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  
  // Get environment variables without assertions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables are not configured' },
      { status: 500 }
    )
  }

  // Use type assertion to bypass deprecated signature check
  const createClientFunc = createServerClient as any
  
  const supabase = createClientFunc(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name: string, options: any) => {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create an org for the user
  const { data: org, error: orgError } = await supabase
    .from('orgs')
    .insert({ name: 'My First Org', slug: 'my-first-org' })
    .select()
    .single()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  // Add user as owner
  const { error: memberError } = await supabase
    .from('org_members')
    .insert({
      org_id: org.id,
      profile_id: session.user.id,
      role: 'owner'
    })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  return NextResponse.json({ 
    message: 'Seed data created successfully',
    org 
  })
}