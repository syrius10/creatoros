// app/api/orgs/[orgId]/invites/route.ts
import { createClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// Correct syntax for Next.js 15.5.0 App Router
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // Await the params to get the actual values
    const { orgId } = await params
    const supabase = await createClient()

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('profile_id', session.user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    // Check if user has permission to create invites (e.g., owner or admin)
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse the request body
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Create the invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .insert({
        email,
        role,
        org_id: orgId,
        token: generateToken(), // You'll need a token generation function
        created_by: session.user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Invite creation error:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invite created successfully',
      invite
    })

  } catch (error: any) {
    console.error('Invite creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate a random token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}