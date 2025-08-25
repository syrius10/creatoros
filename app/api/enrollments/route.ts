import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { course_id, order_id } = await request.json()

    // Get the user's orgs
    const { data: orgs, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .limit(1)

    if (orgError) {
      console.error('Org fetch error:', orgError)
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const orgId = orgs[0].org_id

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', course_id)
      .eq('profile_id', user.id)
      .single()

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })
    }

    // Create enrollment
    const { data: enrollment, error: insertError } = await supabase
      .from('enrollments')
      .insert({
        org_id: orgId,
        course_id,
        profile_id: user.id,
        order_id: order_id || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Enrollment creation error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Unexpected error in enrollment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}