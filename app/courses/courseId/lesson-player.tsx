// app/courses/[courseId]/lesson-player.tsx
'use client'

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

interface LessonPlayerProps {
  sections: Section[]
}

export default function LessonPlayer({ sections }: Readonly<LessonPlayerProps>) {
  // Find the first lesson to play
  const firstLesson = sections[0]?.lessons[0]

  if (!firstLesson) {
    return (
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-xl font-semibold">No lessons available</h2>
        <p className="text-gray-600 mt-2">This course doesn't have any lessons yet.</p>
      </div>
    )
  }

  // Extract nested ternary into separate statements
  let mediaContent: React.ReactNode
  if (firstLesson.video_url) {
    mediaContent = (
      <div className="aspect-video bg-black rounded-lg mb-4">
        <video 
          controls 
          className="w-full h-full rounded-lg"
          src={firstLesson.video_url}
        >
          <track
            kind="captions"
            srcLang="en"
            label="English captions"
            default
          />
          Your browser does not support the video tag.
        </video>
      </div>
    )
  } else if (firstLesson.content) {
    mediaContent = (
      <div 
        className="prose max-w-none mb-4"
        dangerouslySetInnerHTML={{ __html: firstLesson.content }}
      />
    )
  } else {
    mediaContent = (
      <div className="bg-gray-100 p-8 rounded-lg text-center">
        <p className="text-gray-600">No content available for this lesson.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">{firstLesson.title}</h2>
      
      {mediaContent}
      
      <div className="flex justify-between items-center">
        <button className="px-4 py-2 bg-gray-200 rounded-md">Previous</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Next</button>
      </div>
    </div>
  )
}