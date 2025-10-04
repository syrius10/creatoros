import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

export async function POST(request: NextRequest) {
  try {
    const { content, maxLength, orgId } = await request.json();

    if (!content || !orgId) {
      return NextResponse.json({ error: 'Content and orgId are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to org's AI features
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .eq('org_id', orgId)
      .single();

    if (!orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const summary = await aiService.summarizeContent(content, maxLength);

    // Store the generated content
    await supabase
      .from('ai_generated_content')
      .insert([{
        org_id: orgId,
        content_type: 'summary',
        input_text: content.substring(0, 1000), // Store first 1000 chars for reference
        output_text: summary,
        model_used: 'gpt-4'
      }]);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}