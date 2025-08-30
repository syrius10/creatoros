import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Redirect all /community requests to /community/client
  if (request.nextUrl.pathname.startsWith('/community')) {
    // Preserve any path segments after /community
    const pathname = request.nextUrl.pathname.replace('/community', '/community/client')
    return NextResponse.redirect(new URL(pathname, request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/community/:path*',
}