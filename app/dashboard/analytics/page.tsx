'use client';

import { useOrg } from '@/lib/client/contexts/OrgContext';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AnalyticsPage() {
  const { currentOrg } = useOrg();
  const { events, summary } = useAnalytics(currentOrg?.id || '');

  if (!currentOrg) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-500">No organization selected</h2>
        </div>
      </div>
    );
  }

  const analyticsData = {
    summary,
    recentEvents: events
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      <AnalyticsDashboard data={analyticsData} orgId={currentOrg.id} />
    </div>
  );
}