import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { z } from 'zod';

const broadcastSchema = z.object({
  subject: z.string().min(1),
  content: z.string().min(1),
  // @ts-ignore
  list_ids: z.array(z.uuid()),
  // @ts-ignore
  scheduled_for: z.datetime().optional()
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, content, list_ids, scheduled_for } = broadcastSchema.parse(body);
    
    // First, verify that all list_ids belong to the user's organization
    const { data: validLists, error: listError } = await supabase
      .from('email_lists')
      .select('id')
      .in('id', list_ids)
      .eq('org_id', user.user_metadata.org_id);

    if (listError) {
      throw listError;
    }

    if (validLists.length !== list_ids.length) {
      return NextResponse.json({ error: 'One or more lists are invalid' }, { status: 400 });
    }

    // Create broadcast
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .insert({
        org_id: user.user_metadata.org_id,
        subject,
        content,
        status: scheduled_for ? 'scheduled' : 'draft',
        scheduled_for: scheduled_for || null
      })
      .select()
      .single();

    if (broadcastError) throw broadcastError;

    // Create broadcast-list associations
    const broadcastLists = list_ids.map(list_id => ({
      broadcast_id: broadcast.id,
      list_id
    }));

    const { error: broadcastListError } = await supabase
      .from('broadcast_lists')
      .insert(broadcastLists);

    if (broadcastListError) throw broadcastListError;

    return NextResponse.json({ broadcast });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid data' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  let query = supabase
    .from('broadcasts')
    .select(`
      *,
      broadcast_lists (
        email_lists (*)
      )
    `)
    .eq('org_id', user.user_metadata.org_id);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: broadcasts, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ broadcasts });
}