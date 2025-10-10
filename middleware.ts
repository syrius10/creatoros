import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function middleware(request: NextRequest) {
  const { nextUrl, headers } = request;
  const host = headers.get('host') || '';
  
  // Skip for known domains and internal routes
  if (host.includes(process.env.NEXT_PUBLIC_APP_DOMAIN!) || 
      nextUrl.pathname.startsWith('/_next') ||
      nextUrl.pathname.startsWith('/api') ||
      nextUrl.pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Check if this is a custom domain
  const supabase = await createClient();
  const { data: domainRecord } = await supabase
    .from('custom_domains')
    .select('org_id, status')
    .eq('domain_name', host)
    .eq('status', 'active')
    .single();

  if (domainRecord) {
    // Add org_id to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-org-id', domainRecord.org_id);
    requestHeaders.set('x-custom-domain', host);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Also set cookie for client-side access
    response.cookies.set('org-id', domainRecord.org_id);
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/white-label/config).*)',
  ],
};