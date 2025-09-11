import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { orgId } = await request.json();

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  // Check if user is admin
  const { data: user } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('profile_id', user.user?.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Create sample analytics events for the past 30 days
  const eventTypes = [
    'page_view', 'course_view', 'course_enrollment', 'course_completion',
    'checkout_initiated', 'purchase_completed', 'forum_view', 'thread_created'
  ];

  const events = [];
  const now = new Date();
  
  for (let i = 0; i < 200; i++) {
    const eventDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    events.push({
      org_id: orgId,
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      user_id: Math.random() > 0.7 ? user.user?.id : null,
      metadata: { mock: true },
      created_at: eventDate.toISOString()
    });
  }

  const { data: insertedEvents, error } = await supabase
    .from('analytics_events')
    .insert(events)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Sample analytics data created successfully',
    events: insertedEvents 
  });
}