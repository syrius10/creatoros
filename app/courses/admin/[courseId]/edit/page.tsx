// app/courses/admin/[courseId]/edit/page.tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import AIGeneratorButton from '@/components/AIGeneratorButton'

// @ts-ignore - Force ignore the type checking
const CourseEditPage = () => {
  const [outline, setOutline] = useState('')
  const params = useParams()
  const courseId = params.courseId as string

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

// @ts-ignore - Force dynamic export
export default CourseEditPage