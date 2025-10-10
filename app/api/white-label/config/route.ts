import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const domain = searchParams.get('domain');

    if (!orgId && !domain) {
      return NextResponse.json({ error: 'orgId or domain is required' }, { status: 400 });
    }

    let query = supabase
      .from('white_label_configs')
      .select('*')
      .eq('is_active', true);

    if (orgId) {
      query = query.eq('org_id', orgId);
    } else if (domain) {
      // Get org_id from custom_domains
      const { data: domainRecord } = await supabase
        .from('custom_domains')
        .select('org_id')
        .eq('domain_name', domain)
        .eq('status', 'active')
        .single();

      if (!domainRecord) {
        return NextResponse.json({ error: 'Domain not found or not active' }, { status: 404 });
      }

      query = query.eq('org_id', domainRecord.org_id);
    }

    const { data: config, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(config || {});
  } catch (error) {
    console.error('Error fetching white label config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const config = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgMembership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .eq('org_id', config.org_id)
      .single();

    if (!orgMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: existingConfig } = await supabase
      .from('white_label_configs')
      .select('id')
      .eq('org_id', config.org_id)
      .single();

    let result;
    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('white_label_configs')
        .update(config)
        .eq('id', existingConfig.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('white_label_configs')
        .insert([config])
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error saving white label config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}