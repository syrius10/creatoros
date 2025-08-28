import { NextResponse, NextRequest } from 'next/server'
import { AIOrchestrator, AIGenerateRequest } from '@/lib/ai/orchestrator'
import { createClient } from '@/lib/supabaseServer'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Apply rate limiting (10 requests per minute per user)
  const rateLimitResponse = await rateLimit(
    request,
    `ai:${session.user.id}`, 
    10, 
    60000
  )
  if (rateLimitResponse) return rateLimitResponse

  const { prompt, type, context }: AIGenerateRequest = await request.json()

  // Get the user's org
  const { data: orgs, error: orgError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('profile_id', session.user.id)
    .limit(1)

  if (orgError || !orgs || orgs.length === 0) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  const orgId = orgs[0].org_id

  const aiOrchestrator = new AIOrchestrator()
  const result = await aiOrchestrator.generateContent({ prompt, type, context })

  // Log the AI request
  const { error: logError } = await supabase
    .from('ai_audit_log')
    .insert({
      org_id: orgId,
      profile_id: session.user.id,
      prompt,
      response: result.content,
      model: result.model,
      type
    })

  if (logError) {
    console.error('Failed to log AI request:', logError)
  }

  return NextResponse.json(result)
}