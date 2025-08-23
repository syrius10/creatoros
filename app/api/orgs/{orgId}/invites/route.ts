import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, role } = await request.json()

  // Check if user has permission to invite (admin or owner)
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', params.orgId)
    .eq('profile_id', session.user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  const { data: invite, error } = await supabase
    .from('invites')
    .insert({
      org_id: params.orgId,
      email,
      role,
      token,
      created_by: session.user.id,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(invite)
}