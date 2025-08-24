// app/api/invites/[token]/accept/route.ts
import { createClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// Correct syntax for Next.js 15.5.0 App Router
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Await the params to get the actual values
    const { token } = await params
    const supabase = await createClient()

    // Verify the invite exists and is valid
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite' },
        { status: 404 }
      )
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      )
    }

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Create organization membership
    const { error: membershipError } = await supabase
      .from('org_members')
      .insert({
        org_id: invite.org_id,
        profile_id: session.user.id,
        role: invite.role,
      })

    if (membershipError) {
      console.error('Membership creation error:', membershipError)
      return NextResponse.json(
        { error: 'Failed to join organization' },
        { status: 500 }
      )
    }

    // Delete the used invite
    await supabase
      .from('invites')
      .delete()
      .eq('id', invite.id)

    return NextResponse.json({ 
      success: true,
      message: 'Successfully joined organization',
      org_id: invite.org_id
    })

  } catch (error: any) {
    console.error('Invite acceptance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}