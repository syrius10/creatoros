import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return a mock client or handle missing env more gracefully
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables are not configured')
    
    // Return a mock client that won't crash the app
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithOtp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      }),
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}