'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// These exports ensure no static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function CommunityPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a client-side only route
    router.push('/community/client');
  }, [router]);

  return <div className="flex justify-center p-8">Loading community...</div>;
}