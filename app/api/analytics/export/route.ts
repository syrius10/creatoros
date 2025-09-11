import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const range = searchParams.get('range');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Verify user has access to this org
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data: orgMembership, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('profile_id', user.id)
      .eq('org_id', orgId)
      .single();

    if (orgError || !orgMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch analytics data
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert to CSV
    const csvHeader = 'Event Type,Entity Type,Entity ID,User ID,Timestamp,Metadata\n';
    const csvRows = events.map((event: any) => 
      `"${event.event_type}","${event.entity_type || ''}","${event.entity_id || ''}","${event.user_id || ''}","${format(new Date(event.created_at), 'yyyy-MM-dd HH:mm:ss')}","${JSON.stringify(event.metadata || {})}"`
    ).join('\n');

    const csv = csvHeader + csvRows;

    // Return as CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-export-${format(now, 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error in analytics export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}