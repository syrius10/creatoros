// app/api/invites/[token]/accept/route.ts
import { createClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// Use NextRequest instead of Request and proper params typing
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient()
    const { token } = params

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

// Also add a GET handler for direct link visits
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient()
    const { token } = params

    // Verify the invite exists and is valid
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*, orgs(name)')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.redirect(new URL('/invite-expired', request.url))
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/invite-expired', request.url))
    }

    // If user is logged in, redirect to accept page
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Redirect to a page that will automatically accept the invite
      return NextResponse.redirect(new URL(`/invites/${token}/accept`, request.url))
    }

    // If not logged in, redirect to signin with invite token
    return NextResponse.redirect(new URL(`/signin?invite_token=${token}`, request.url))

  } catch (error: any) {
    console.error('Invite GET error:', error)
    return NextResponse.redirect(new URL('/invite-error', request.url))
  }
}