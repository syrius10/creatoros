import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { generateVerificationToken, validateDomain } from '@/lib/domainUtils';

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

    const { data: domains, error } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { domain_name, org_id } = await request.json();

    if (!domain_name || !org_id) {
      return NextResponse.json({ error: 'domain_name and org_id are required' }, { status: 400 });
    }

    // Validate domain format
    if (!validateDomain(domain_name)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgMembership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .eq('org_id', org_id)
      .single();

    if (!orgMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if domain is already taken
    const { data: existingDomain } = await supabase
      .from('custom_domains')
      .select('id')
      .eq('domain_name', domain_name)
      .single();

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain is already in use' }, { status: 409 });
    }

    const verificationToken = generateVerificationToken();
    const dnsRecords = [
      {
        type: 'CNAME',
        name: domain_name,
        value: process.env.NEXT_PUBLIC_APP_DOMAIN || 'yourapp.com',
        status: 'pending'
      },
      {
        type: 'TXT',
        name: `_creatoros-verification.${domain_name}`,
        value: verificationToken,
        status: 'pending'
      }
    ];

    const { data: domain, error } = await supabase
      .from('custom_domains')
      .insert([{
        org_id,
        domain_name,
        verification_token: verificationToken,
        dns_records: dnsRecords
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(domain);
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}