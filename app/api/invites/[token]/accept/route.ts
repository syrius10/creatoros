// app/api/invites/[token]/accept/route.ts
import { createClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// Define the parameter type interface
interface RouteParams {
  params: { token: string }
}

// Use the correct syntax for route handlers
export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const supabase = await createClient()
    const { token } = context.params

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

// GET handler - REMOVE THIS if you don't need it
// API routes typically shouldn't handle GET for redirects - use pages instead
/*
export async function GET(
  request: NextRequest,
  context: { params: { token: string } }
) {
  // Redirect to a page component that handles the UI
  return NextResponse.redirect(new URL('/invites/accept', request.url))
}
*/