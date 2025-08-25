// lib/supabaseServer.ts - TEMPORARY FIX
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // ✅ TEMPORARILY DISABLE SET/REMOVE
        set() {
          // Do nothing - prevent cookie operations
        },
        remove() {
          // Do nothing - prevent cookie operations
        },
      },
    }
  )
}