import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { hashApiKey, generateApiKey } from '@/lib/apiKeyUtils';

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

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Never return the actual key hash
    const sanitizedKeys = apiKeys.map(key => ({
      ...key,
      key_hash: undefined
    }));

    return NextResponse.json(sanitizedKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { name, description, scopes, rate_limit_per_minute, expires_at } = await request.json();

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

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);

    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .insert([{
        org_id: orgMembership.org_id,
        name,
        description,
        scopes: scopes || [],
        rate_limit_per_minute: rate_limit_per_minute || 60,
        key_hash: keyHash,
        expires_at,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the API key only once
    return NextResponse.json({
      ...apiKeyRecord,
      api_key: apiKey, // Only time the actual key is returned
      key_hash: undefined
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}