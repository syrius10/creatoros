// app/builder/[siteId]/pages/[pageId]/page.tsx
'use client'

import { createClient } from '@/lib/supabaseBrowser'
import { useEffect, useState } from 'react'

interface Block {
  id: string
  type: string
  content: any
  sort_order: number
}

export default function PageBuilder({ params }: { params: Promise<{ siteId: string; pageId: string }> }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvedParams, setResolvedParams] = useState<{ siteId: string; pageId: string } | null>(null)
  const supabase = createClient()

  // Resolve the params promise
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (!resolvedParams) return

    const fetchBlocks = async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', resolvedParams.pageId)
        .order('sort_order')

      if (error) {
        console.error(error)
      } else {
        setBlocks(data || [])
      }
      setLoading(false)
    }

    fetchBlocks()
  }, [resolvedParams, supabase])

  const addBlock = async (type: string) => {
    if (!resolvedParams) return

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        page_id: resolvedParams.pageId,
        type,
        content: { text: 'New block' },
        sort_order: blocks.length,
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
    } else {
      setBlocks([...blocks, data])
    }
  }

  if (loading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Page Builder</h1>
          <div className="mt-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex space-x-4 mb-4">
                <button onClick={() => addBlock('heading')} className="px-4 py-2 bg-indigo-600 text-white rounded">
                  Add Heading
                </button>
                <button onClick={() => addBlock('paragraph')} className="px-4 py-2 bg-indigo-600 text-white rounded">
                  Add Paragraph
                </button>
                <button onClick={() => addBlock('image')} className="px-4 py-2 bg-indigo-600 text-white rounded">
                  Add Image
                </button>
              </div>
              <div className="space-y-4">
                {blocks.map((block) => (
                  <div key={block.id} className="p-4 border border-gray-300 rounded">
                    <h3 className="font-semibold">{block.type}</h3>
                    <p>{block.content.text || block.content.url || 'No content'}</p>
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