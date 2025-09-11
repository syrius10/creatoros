import { createClient } from './supabaseServer';

export interface AnalyticsEvent {
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: any;
}

export async function trackEvent(event: AnalyticsEvent) {
  const supabase = await createClient();
  
  // Get user and org info
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orgMembership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('profile_id', user?.id)
    .single();

  if (!orgMembership) return;

  await supabase
    .from('analytics_events')
    .insert([{
      org_id: orgMembership.org_id,
      user_id: user?.id,
      ...event
    }]);
}

export async function getAnalyticsSummary(orgId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient();
  
  // Get counts for each event type using a different approach
  const eventTypes = [
    'page_view', 'course_view', 'course_enrollment', 'course_completion',
    'checkout_initiated', 'purchase_completed', 'forum_view', 'thread_created',
    'comment_created', 'reaction_added'
  ];

  const summary: Record<string, number> = {};

  for (const eventType of eventTypes) {
    let query = supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('event_type', eventType);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { count, error } = await query;

    if (!error) {
      summary[eventType] = count || 0;
    }
  }

  return summary;
}