import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Use NextRequest instead of Request and proper params typing
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sections, error } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order')

    if (error) {
      console.error('Sections GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Unexpected error in sections GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description } = await request.json()

    // Get the next sort order
    const { data: lastSection } = await supabase
      .from('sections')
      .select('sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = lastSection?.[0]?.sort_order + 1 || 0

    const { data: section, error: insertError } = await supabase
      .from('sections')
      .insert({
        course_id: courseId,
        title,
        description,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Sections POST error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error('Unexpected error in sections POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}