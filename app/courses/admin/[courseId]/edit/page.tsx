'use client'

import { useState, useEffect } from 'react'
import AIGeneratorButton from '@/components/AIGeneratorButton'

// Simplified interface without searchParams
interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseEditPage({ params }: PageProps) {
  const [outline, setOutline] = useState('')
  const [courseId, setCourseId] = useState<string>('')

  // Use useEffect to handle the async params
  useEffect(() => {
    params.then(resolvedParams => {
      setCourseId(resolvedParams.courseId)
    }).catch(error => {
      console.error('Error resolving params:', error)
    })
  }, [params])

  const handleOutlineGenerated = (content: string) => {
    setOutline(content)
  }

  return (
    <div>
      <h1>Edit Course {courseId}</h1>
      <div>
        <h2>Course Outline</h2>
        <AIGeneratorButton
          type="course_outline"
          onGenerate={handleOutlineGenerated}
          buttonText="Generate Outline"
        />
        <textarea
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          className="w-full h-48 border rounded-md p-2"
        />
      </div>
    </div>
  )
}