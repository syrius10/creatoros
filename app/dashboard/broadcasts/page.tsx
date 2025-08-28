'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmailList {
  id: string;
  name: string;
}

interface Broadcast {
  id: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  broadcast_lists: {
    email_lists: EmailList;
  }[];
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch('/api/broadcasts');
      const { broadcasts } = await response.json();
      setBroadcasts(broadcasts);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // Map status to valid badge variants
    const variantMap: Record<string, 'secondary' | 'warning' | 'info' | 'success'> = {
      draft: 'secondary',
      scheduled: 'warning',
      sending: 'info',
      sent: 'success'
    };
    
    // Use the mapped variant or default to 'secondary' if not found
    const variant = variantMap[status] || 'secondary';
    
    return (
      <Badge variant={variant}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Broadcasts</h1>
        <Link href="/dashboard/broadcasts/create">
          <Button>Create Broadcast</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {broadcasts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No broadcasts yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          broadcasts.map((broadcast) => (
            <Card key={broadcast.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {broadcast.subject}
                  {getStatusBadge(broadcast.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="text-sm font-medium">Lists: </span>
                  {broadcast.broadcast_lists && broadcast.broadcast_lists.length > 0 ? (
                    broadcast.broadcast_lists.map((bl, index) => (
                      <span key={bl.email_lists.id} className="text-sm text-muted-foreground">
                        {bl.email_lists.name}
                        {index < broadcast.broadcast_lists.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No lists</span>
                  )}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Created: {new Date(broadcast.created_at).toLocaleDateString()}</span>
                  {broadcast.sent_at && (
                    <span>Sent: {new Date(broadcast.sent_at).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}