import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgMembership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .eq('org_id', orgId)
      .single();

    if (!orgMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: sequences, error } = await supabase
      .from('sequences')
      .select(`
        *,
        sequence_steps (*)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(sequences);
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { name, description, is_active, steps } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgMembership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .single();

    if (!orgMembership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Create sequence
    const { data: sequence, error: sequenceError } = await supabase
      .from('sequences')
      .insert([{
        org_id: orgMembership.org_id,
        name,
        description,
        is_active,
        created_by: user.id
      }])
      .select()
      .single();

    if (sequenceError) {
      return NextResponse.json({ error: sequenceError.message }, { status: 500 });
    }

    // Create steps if provided
    if (steps && steps.length > 0) {
      const sequenceSteps = steps.map((step: any, index: number) => ({
        sequence_id: sequence.id,
        step_order: index + 1,
        ...step
      }));

      const { error: stepsError } = await supabase
        .from('sequence_steps')
        .insert(sequenceSteps);

      if (stepsError) {
        return NextResponse.json({ error: stepsError.message }, { status: 500 });
      }
    }

    return NextResponse.json(sequence);
  } catch (error) {
    console.error('Error creating sequence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}