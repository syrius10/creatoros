import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Verify user has access to this org
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data: orgMembership, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .eq('org_id', orgId)
      .single();

    if (orgError || !orgMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: programs, error } = await supabase
      .from('affiliate_programs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching affiliate programs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { name, description, commission_rate, cookie_duration, terms } = await request.json();

    // Get user and org info
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data: orgMembership, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .single();

    if (orgError || !orgMembership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { data: program, error } = await supabase
      .from('affiliate_programs')
      .insert([{
        org_id: orgMembership.org_id,
        name,
        description,
        commission_rate,
        cookie_duration,
        terms,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error creating affiliate program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}