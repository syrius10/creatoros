import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: offlineContent, error } = await supabase
      .from('offline_access')
      .select('*')
      .eq('user_id', user.id)
      .order('downloaded_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(offlineContent);
  } catch (error) {
    console.error('Error fetching offline content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { content_type, content_id, title, file_path, file_size, expires_at } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: offlineItem, error } = await supabase
      .from('offline_access')
      .upsert([{
        user_id: user.id,
        content_type,
        content_id,
        title,
        file_path,
        file_size,
        expires_at
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(offlineItem);
  } catch (error) {
    console.error('Error saving offline content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}