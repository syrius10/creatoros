import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params
  const supabase = await createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { content, sort_order } = await request.json()

  const { data: block, error } = await supabase
    .from('blocks')
    .update({
      content,
      sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blockId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(block)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params
  const supabase = await createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('id', blockId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Block deleted' })
}