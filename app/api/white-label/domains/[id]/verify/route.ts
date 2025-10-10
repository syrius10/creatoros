import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { verifyDomainOwnership } from '@/lib/domainUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const domainId = params.id;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get domain record
    const { data: domain, error: domainError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('id', domainId)
      .single();

    if (domainError) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Verify user has access to this domain's org
    const { data: orgMembership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .eq('org_id', domain.org_id)
      .single();

    if (!orgMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify domain ownership
    const verificationResult = await verifyDomainOwnership(domain.domain_name, domain.verification_token);

    if (verificationResult.verified) {
      // Update domain status
      const { error: updateError } = await supabase
        .from('custom_domains')
        .update({
          status: 'active',
          verified_at: new Date().toISOString(),
          last_verified_at: new Date().toISOString(),
          dns_records: verificationResult.dnsRecords
        })
        .eq('id', domainId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        verified: true, 
        message: 'Domain verified successfully',
        dnsRecords: verificationResult.dnsRecords
      });
    } else {
      // Update with current DNS status
      await supabase
        .from('custom_domains')
        .update({
          last_verified_at: new Date().toISOString(),
          dns_records: verificationResult.dnsRecords
        })
        .eq('id', domainId);

      return NextResponse.json({ 
        verified: false, 
        message: 'Domain verification failed',
        dnsRecords: verificationResult.dnsRecords
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}