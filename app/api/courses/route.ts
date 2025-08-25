import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get the user's organization IDs
    const { data: userOrgs, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    if (!userOrgs || userOrgs.length === 0) {
      return NextResponse.json([]) // Return empty array if no orgs
    }

    const orgIds = userOrgs.map(org => org.org_id)

    // Get courses for the user's orgs
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        sections:section_count(count),
        lessons:lesson_count(count)
      `)
      .in('org_id', orgIds) // Pass the array of org IDs

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(courses || [])
  } catch (error) {
    console.error('Courses GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, price_id } = await request.json()

    // Get the user's organizations
    const { data: orgs, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const orgId = orgs[0].org_id

    const { data: course, error: insertError } = await supabase
      .from('courses')
      .insert({
        org_id: orgId,
        title,
        description,
        price_id: price_id || null,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Courses POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}