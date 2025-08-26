// app/courses/admin/new/page.tsx
'use client'

import { useState } from 'react'
import AIGeneratorButton from '@/components/AIGeneratorButton'

export default function NewCoursePage() {
  const [outline, setOutline] = useState('')

  const handleOutlineGenerated = (content: string) => {
    setOutline(content)
  }

  return (
    <div>
      <h1>Create New Course</h1>
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