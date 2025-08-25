// tests/auth-helper.ts
import { createClient } from '@supabase/supabase-js'

export async function signInProgrammatically(email: string, password: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role key
  )
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export async function createTestUser(email: string, password: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Auto-confirm for testing
  })
  
  if (error) throw error
  return data
}