import { createClient } from '@/lib/supabaseBrowser'
import { redirect } from 'next/navigation'

export default async function Home() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Session error:', error)
      redirect('/signin')
    }

    if (!session) {
      redirect('/signin')
    } else {
      redirect('/dashboard')
    }
  } catch (error) {
    console.error('Home page error:', error)
    redirect('/signin')
  }
}