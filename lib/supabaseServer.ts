import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Define a type for the function that matches what we actually need
type CreateServerClientType = (
  supabaseUrl: string,
  supabaseKey: string,
  options: {
    cookies: {
      get: (name: string) => string | undefined
      set: (name: string, value: string, options: any) => void
      remove: (name: string, options: any) => void
    }
  }
) => any

export const createClient = async () => {
  const cookieStore = await cookies()

  // Assert to our custom type
  const createClientFunc = createServerClient as unknown as CreateServerClientType

  // Remove the ! operators - they're causing the "unnecessary assertion" warning
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Add proper error handling for missing environment variables
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not set')
  }

  return createClientFunc(
    supabaseUrl, // No ! needed
    supabaseKey, // No ! needed
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}