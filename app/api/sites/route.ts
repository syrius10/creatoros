import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // First, get the user's organization IDs
  const { data: orgMemberships, error: orgError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('profile_id', session.user.id)

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  if (!orgMemberships || orgMemberships.length === 0) {
    return NextResponse.json([]) // Return empty array if no orgs
  }

  // Extract the org IDs into an array
  const orgIds = orgMemberships.map(member => member.org_id)

  // Get sites for the user's orgs
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .in('org_id', orgIds) // Pass the array of org IDs

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(sites)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, subdomain } = await request.json()

  // Get the user's first org for demo purposes
  const { data: orgs, error: orgError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('profile_id', session.user.id)
    .limit(1)

  if (orgError || !orgs || orgs.length === 0) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  const orgId = orgs[0].org_id

  const { data: site, error: siteError } = await supabase
    .from('sites')
    .insert({
      org_id: orgId,
      name,
      subdomain,
    })
    .select()
    .single()

  if (siteError) {
    return NextResponse.json({ error: siteError.message }, { status: 500 })
  }

  return NextResponse.json(site)
}