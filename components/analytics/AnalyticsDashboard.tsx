'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnalyticsDashboardProps {
  readonly data: any;
  readonly orgId: string;
}

// Simple SVG icons as fallback - moved outside the component
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

export default function AnalyticsDashboard({ data, orgId }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState('30d');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/analytics/export?orgId=${orgId}&range=${dateRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant={dateRange === '7d' ? 'default' : 'outline'} onClick={() => setDateRange('7d')}>
            7D
          </Button>
          <Button variant={dateRange === '30d' ? 'default' : 'outline'} onClick={() => setDateRange('30d')}>
            30D
          </Button>
          <Button variant={dateRange === '90d' ? 'default' : 'outline'} onClick={() => setDateRange('90d')}>
            90D
          </Button>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          <DownloadIcon />
          <span className="ml-2">Export Data</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <ChartIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.summary?.page_view || 0) + (data.summary?.course_view || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <ChartIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.course_enrollment || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <ChartIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.course_completion || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <ChartIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.purchase_completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentEvents?.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-muted p-2 rounded-md">
                    <ChartIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{event.event_type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {event.entity_type || 'General'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}