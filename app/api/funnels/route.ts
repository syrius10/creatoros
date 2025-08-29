import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { z } from 'zod';

const funnelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description } = funnelSchema.parse(body);
    
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .insert({
        org_id: user.user_metadata.org_id,
        name,
        description,
      })
      .select()
      .single();

    if (funnelError) throw funnelError;

    return NextResponse.json({ funnel });
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

  const { data: funnels, error } = await supabase
    .from('funnels')
    .select('*')
    .eq('org_id', user.user_metadata.org_id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ funnels });
}