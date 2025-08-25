import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('section_id', sectionId)
      .order('sort_order')

    if (error) {
      console.error('Lessons GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Unexpected error in lessons GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, is_free } = await request.json()

    // Get the next sort order
    const { data: lastLesson } = await supabase
      .from('lessons')
      .select('sort_order')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = lastLesson?.[0]?.sort_order + 1 || 0

    const { data: lesson, error: insertError } = await supabase
      .from('lessons')
      .insert({
        section_id: sectionId,
        title,
        description,
        is_free: is_free || false,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Lessons POST error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Unexpected error in lessons POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}