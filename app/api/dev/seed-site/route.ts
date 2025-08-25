import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the user's first org
  const { data: orgs, error: orgsError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('profile_id', session.user.id)
    .limit(1)

  if (orgsError || !orgs || orgs.length === 0) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  const orgId = orgs[0].org_id

  // Create a site
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .insert({
      org_id: orgId,
      name: 'Sample Site',
      subdomain: 'sample',
    })
    .select()
    .single()

  if (siteError) {
    return NextResponse.json({ error: siteError.message }, { status: 500 })
  }

  // Create a page
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .insert({
      site_id: site.id,
      title: 'Home Page',
      slug: 'home',
    })
    .select()
    .single()

  if (pageError) {
    return NextResponse.json({ error: pageError.message }, { status: 500 })
  }

  // Create some blocks
  const blocks = [
    { type: 'heading', content: { text: 'Welcome to My Site' } },
    { type: 'paragraph', content: { text: 'This is a sample paragraph.' } },
  ]

  for (let i = 0; i < blocks.length; i++) {
    const { error: blockError } = await supabase
      .from('blocks')
      .insert({
        page_id: page.id,
        type: blocks[i].type,
        content: blocks[i].content,
        sort_order: i,
      })

    if (blockError) {
      return NextResponse.json({ error: blockError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ site, page })
}