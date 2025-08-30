import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Redirect /community to /community/client
  if (request.nextUrl.pathname === '/community') {
    return NextResponse.redirect(new URL('/community/client', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/community',
}