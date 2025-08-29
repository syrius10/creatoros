'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function FunnelsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketing Funnels</h1>
        <Link href="/dashboard/funnels/create">
          <Button>Create Funnel</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No funnels yet. Create your first one!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}