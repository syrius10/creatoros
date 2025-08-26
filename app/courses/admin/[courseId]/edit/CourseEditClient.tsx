// app/courses/admin/[courseId]/edit/CourseEditClient.tsx
'use client'

import { useState } from 'react'
import AIGeneratorButton from '@/components/AIGeneratorButton'

interface CourseEditClientProps {
  courseId: string;
}

export default function CourseEditClient({ courseId }: CourseEditClientProps) {
  const [outline, setOutline] = useState('')

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