import { createClient } from '@/lib/supabaseServer'
import { NextResponse, NextRequest } from 'next/server'

export async function POST(
  request: NextRequest, // Use NextRequest instead of Request
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> { // Add explicit return type
  const { token } = await params
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the invite
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  }

  // Check if the current user's email matches the invite email
  if (session.user.email !== invite.email) {
    return NextResponse.json({ error: 'This invite is for a different email' }, { status: 403 })
  }

  // Add user to org
  const { error: memberError } = await supabase
    .from('org_members')
    .insert({
      org_id: invite.org_id,
      profile_id: session.user.id,
      role: invite.role
    })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Delete the invite
  await supabase
    .from('invites')
    .delete()
    .eq('id', invite.id)

  return NextResponse.json({ message: 'Invite accepted successfully' })
}