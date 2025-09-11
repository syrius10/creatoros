import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';

export function useAnalytics(orgId: string) {
  const [events, setEvents] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!orgId) return;

    // Initial fetch
    const fetchData = async () => {
      const { data: eventsData } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get counts for each event type using a different approach
      const eventTypes = [
        'page_view', 'course_view', 'course_enrollment', 'course_completion',
        'checkout_initiated', 'purchase_completed', 'forum_view', 'thread_created',
        'comment_created', 'reaction_added'
      ];
      
      const summaryObj: Record<string, number> = {};
      
      for (const eventType of eventTypes) {
        const { count, error } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('event_type', eventType);
        
        if (!error) {
          summaryObj[eventType] = count || 0;
        }
      }

      if (eventsData) setEvents(eventsData);
      setSummary(summaryObj);
    };

    fetchData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('analytics-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'analytics_events',
        filter: `org_id=eq.${orgId}`
      }, (payload) => {
        setEvents(prev => [payload.new, ...prev.slice(0, 49)]);
        setSummary(prev => ({
          ...prev,
          [payload.new.event_type]: (prev[payload.new.event_type] || 0) + 1
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, supabase]);

  return { events, summary };
}