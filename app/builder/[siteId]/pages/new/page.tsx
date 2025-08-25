// app/builder/[siteId]/pages/new/page.tsx
'use client'

import { createClient } from '@/lib/supabaseBrowser'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPage({ params }: { params: Promise<{ siteId: string }> }) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ siteId: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Resolve the params promise
  if (!resolvedParams) {
    params.then(setResolvedParams)
    return <div>Loading...</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('pages')
      .insert({
        site_id: resolvedParams.siteId,
        title,
        slug,
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
    } else {
      router.push(`/builder/${resolvedParams.siteId}/pages/${data.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Page</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Page'}
          </button>
        </form>
      </div>
    </div>
  )
}