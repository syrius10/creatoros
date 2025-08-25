// app/courses/admin/course-admin.tsx
'use client'

import { useState } from 'react'

export default function CourseAdmin() {
  // const [courses, setCourses] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '' })

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Course Administration</h1>
      
      <button 
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        {showCreateForm ? 'Cancel' : 'Create New Course'}
      </button>

      {showCreateForm && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
          <input
            type="text"
            placeholder="Course Title"
            className="border p-2 rounded w-full mb-2"
            value={newCourse.title}
            onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
          />
          <textarea
            placeholder="Course Description"
            className="border p-2 rounded w-full mb-2"
            value={newCourse.description}
            onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Create Course
          </button>
        </div>
      )}

      <div className="bg-white rounded shadow">
        <h2 className="text-xl font-semibold p-4 border-b">Existing Courses</h2>
        {/* List courses here */}
      </div>
    </div>
  )
}