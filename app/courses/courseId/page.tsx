// app/courses/[courseId]/page.tsx
import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import LessonPlayer from './lesson-player'

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  content: string | null
  is_free: boolean
  sort_order: number
  lesson_progress: Array<{
    completed: boolean
    progress: number
  }>
}

interface Section {
  id: string
  title: string
  description: string | null
  sort_order: number
  lessons: Lesson[]
}

export default async function CoursePage({
  params,
}: Readonly<{
  params: Promise<{ courseId: string }>
}>) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/signin')
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('course_id', courseId)
    .eq('profile_id', user.id)
    .single()

  if (!enrollment) {
    redirect('/courses')
  }

  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  // Get sections with lessons
  const { data: sections } = await supabase
    .from('sections')
    .select(`
      *,
      lessons(*, lesson_progress!inner(*))
    `)
    .eq('course_id', courseId)
    .order('sort_order')

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
          <p className="mt-2 text-gray-600">{course?.description}</p>
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <LessonPlayer sections={sections as Section[] || []} />
            </div>
            
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold">Course Content</h2>
              <div className="mt-4 space-y-4">
                {sections?.map((section: Section) => (
                  <div key={section.id} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium">{section.title}</h3>
                    <ul className="mt-2 space-y-2">
                      {section.lessons.map((lesson: Lesson) => (
                        <li key={lesson.id} className="flex items-center">
                          <span className="text-sm text-gray-600">{lesson.title}</span>
                          {lesson.lesson_progress[0]?.completed && (
                            <span className="ml-2 text-green-600">✓</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}