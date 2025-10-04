import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

export async function POST(request: NextRequest) {
  try {
    const { goals, skills, orgId } = await request.json();

    if (!goals || !Array.isArray(goals) || !orgId) {
      return NextResponse.json({ error: 'Goals array and orgId are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const learningPath = await aiService.generateLearningPath(user.id, goals, skills || []);

    // Store the learning path
    const { data: path } = await supabase
      .from('learning_paths')
      .insert([{
        user_id: user.id,
        org_id: orgId,
        name: learningPath.title || 'Personalized Learning Path',
        description: learningPath.description,
        goals: goals,
        estimated_hours: learningPath.totalHours,
        difficulty_level: learningPath.difficulty
      }])
      .select()
      .single();

    // Store path items
    if (path && learningPath.weeks) {
      const pathItems = learningPath.weeks.flatMap((week: any, weekIndex: number) => 
        week.items.map((item: any, itemIndex: number) => ({
          learning_path_id: path.id,
          content_id: item.contentId, // You'd map this to actual content
          content_type: item.type,
          item_order: (weekIndex * 10) + itemIndex,
          estimated_duration_minutes: item.duration
        }))
      );

      await supabase
        .from('learning_path_items')
        .insert(pathItems);
    }

    return NextResponse.json({ learningPath: path });
  } catch (error) {
    console.error('Learning path generation error:', error);
    return NextResponse.json({ error: 'Failed to generate learning path' }, { status: 500 });
  }
}