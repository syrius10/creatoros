import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Simple in-memory rate limiting (consider Redis for production at scale)
const rateLimitMap = new Map()

export async function rateLimit(
  request: NextRequest, 
  identifier: string, 
  limit: number = 10, 
  windowMs: number = 60000
): Promise<Response | null> {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean up old entries
  const keys = Array.from(rateLimitMap.keys())
  for (const key of keys) {
    const { timestamp } = rateLimitMap.get(key)
    if (timestamp < windowStart) {
      rateLimitMap.delete(key)
    }
  }
  
  // Get IP from headers (compatible with Next.js 15.5.0)
  const headersList = await headers()
  const ip = headersList.get('x-real-ip') || 
             headersList.get('x-forwarded-for')?.split(',')[0] || 
             'unknown'
  
  const key = `${identifier}:${ip}`
  const current = rateLimitMap.get(key) || { count: 0, timestamp: now }
  
  if (current.count >= limit) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  
  rateLimitMap.set(key, { count: current.count + 1, timestamp: now })
  return null
}