import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/signin')
  }

  // Get enrolled courses
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      org:orgs(name),
      enrollments!inner(*)
    `)
    .eq('enrollments.profile_id', user.id)

  // Get available courses (not enrolled yet)
  // First get enrolled course IDs
  const { data: enrolledCourses } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('profile_id', user.id)

  const enrolledCourseIds = enrolledCourses?.map(ec => ec.course_id) || []

  const { data: availableCourses } = await supabase
    .from('courses')
    .select(`
      *,
      org:orgs(name),
      prices(*)
    `)
    .not('id', 'in', `(${enrolledCourseIds.join(',')})`.replace('()', '(null)'))

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Enrolled Courses</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses?.map((course) => (
                <div key={course.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{course.org.name}</p>
                    <p className="mt-2 text-gray-600">{course.description}</p>
                    <div className="mt-4">
                      <Link href={`/courses/${course.id}`} className="text-indigo-600 hover:text-indigo-900">
                        Continue Learning
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-semibold">Available Courses</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableCourses?.map((course) => (
                <div key={course.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{course.org.name}</p>
                    <p className="mt-2 text-gray-600">{course.description}</p>
                    <div className="mt-4">
                      {course.prices && course.prices.length > 0 ? (
                        <Link href={`/pricing`} className="text-indigo-600 hover:text-indigo-900">
                          Purchase Course - ${course.prices[0].unit_amount / 100}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Free Course</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}