import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Affiliate code is required' }, { status: 400 });
    }

    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, program_id, status')
      .eq('code', code)
      .single();

    if (affiliateError || !affiliate || affiliate.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 400 });
    }

    // Get user info if available
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Create referral record
    const { data: referral, error } = await supabase
      .from('affiliate_referrals')
      .insert([{
        affiliate_id: affiliate.id,
        user_id: user?.id,
        code,
        ip_address: ipAddress,
        user_agent: userAgent,
        landing_page: request.headers.get('referer') || 'direct'
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Set affiliate cookie - need to await the cookies() function
    const cookieStore = await cookies();
    cookieStore.set('affiliate_code', code, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      sameSite: 'lax'
    });

    return NextResponse.json({ success: true, referral_id: referral.id });
  } catch (error) {
    console.error('Error tracking affiliate referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}