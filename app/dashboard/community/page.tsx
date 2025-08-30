'use client';

import { useEffect, useState } from 'react';
import CommunityClient from './CommunityClient';

// These exports ensure no static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function CommunityPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything during SSR
  if (!isClient) {
    return <div className="flex justify-center p-8">Loading community...</div>;
  }

  return <CommunityClient />;
}