// app/courses/admin/page.tsx
import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import CourseAdmin from './course-admin'

export default async function CoursesAdminPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/signin')
  }

  // Check if user has admin permissions (you might need to implement this)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userProfile?.is_admin) {
    redirect('/courses')
  }

  return <CourseAdmin />
}