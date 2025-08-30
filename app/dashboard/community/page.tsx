'use client';

import { useEffect, useState } from 'react';
import { default as nextDynamic } from 'next/dynamic';

// Disable SSR completely using dynamic import with alias
const CommunityClient = nextDynamic(() => import('./CommunityClient'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading community...</div>
});

// These exports ensure no static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function CommunityPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything during SSR
  if (!isMounted) {
    return null;
  }

  return <CommunityClient />;
}