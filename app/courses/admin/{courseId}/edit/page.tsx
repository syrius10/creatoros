'use client'

import { useState } from 'react'
import AIGeneratorButton from '@/components/AIGeneratorButton'

export default function CourseEditPage({ params }: { params: { courseId: string } }) {
  const [outline, setOutline] = useState('')

  const handleOutlineGenerated = (content: string) => {
    setOutline(content)
    // You might want to parse the JSON and update the course structure
  }

  return (
    <div>
      <h1>Edit Course</h1>
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