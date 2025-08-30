// Use an import alias to avoid the naming conflict
import { default as nextDynamic } from 'next/dynamic';

// Disable SSR completely for this page
const CommunityClient = nextDynamic(
  () => import('./CommunityClient'),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center p-8">Loading community...</div>
  }
);

// Next.js page configuration
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function CommunityPage() {
  return <CommunityClient />;
}