// lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie)
            }
          } catch (error) {
            // The `setAll` method was called from a Server Component
            // This can be ignored if you have middleware refreshing user sessions
            console.error('Failed to set cookies:', error)
          }
        },
      },
    }
  )
}