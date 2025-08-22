import { test } from '@playwright/test'

test('check supabase connection', async ({ request }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Testing Supabase URL:', supabaseUrl)
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables missing. Check that .env.local exists and Playwright config loads it.')
  }
  
  // Test the auth endpoint directly
  try {
    const response = await request.post(`${supabaseUrl}/auth/v1/otp`, {
      data: {
        email: 'test@example.com',
        redirect_to: 'http://localhost:3000/auth/callback'
      },
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Supabase auth response status:', response.status())
    
    // 400 might be expected for invalid email format, but means API is reachable
    if (response.status() === 400) {
      console.log('✅ Supabase API is reachable (400 means bad request, but connection works)')
      const body = await response.text()
      console.log('Response body:', body)
    } else if (response.ok()) {
      console.log('✅ Supabase API is working correctly')
    } else {
      console.log('❌ Supabase API error:', response.status())
    }
    
  } catch (error) {
    // Proper error type handling
    if (error instanceof Error) {
      console.log('❌ Cannot connect to Supabase API:', error.message)
      throw error
    } else {
      console.log('❌ Unknown error connecting to Supabase API')
      throw new Error('Unknown error occurred')
    }
  }
})