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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgMembership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .eq('org_id', orgId)
      .single();

    if (!orgMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: triggers, error } = await supabase
      .from('automation_triggers')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(triggers);
  } catch (error) {
    console.error('Error fetching triggers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { name, description, trigger_type, conditions, is_active } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgMembership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .single();

    if (!orgMembership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { data: trigger, error } = await supabase
      .from('automation_triggers')
      .insert([{
        org_id: orgMembership.org_id,
        name,
        description,
        trigger_type,
        conditions,
        is_active,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(trigger);
  } catch (error) {
    console.error('Error creating trigger:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}