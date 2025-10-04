import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || (userId && user.id !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = userId || user.id;

    // Get cached recommendations first
    const { data: cachedRecommendations } = await supabase
      .from('content_recommendations')
      .select(`
        *,
        courses:content_id(*),
        lessons:content_id(*)
      `)
      .eq('user_id', targetUserId)
      .order('score', { ascending: false })
      .limit(limit);

    if (cachedRecommendations && cachedRecommendations.length >= limit) {
      return NextResponse.json(cachedRecommendations);
    }

    // Generate new recommendations
    const recommendations = await aiService.generateContentRecommendations(targetUserId, limit);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}