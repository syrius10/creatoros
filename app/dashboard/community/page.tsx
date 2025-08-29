'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrg } from '@/contexts/OrgContext';

export default function CommunityPage() {
  const [forums, setForums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { currentOrg, loading: orgLoading } = useOrg();

  useEffect(() => {
    async function loadForums() {
      if (!currentOrg) return;
      
      const { data: forumsData } = await supabase
        .from('forums')
        .select('*, orgs(name)')
        .eq('org_id', currentOrg.id)
        .order('position', { ascending: true });

      setForums(forumsData || []);
      setLoading(false);
    }

    if (currentOrg) {
      loadForums();
    }
  }, [currentOrg, supabase]);

  if (orgLoading) {
    return <div className="flex justify-center p-8">Loading organizations...</div>;
  }

  if (!currentOrg) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Community Forums</h1>
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-500">No organization selected</h2>
          <p className="text-gray-400 mt-2">
            Please select an organization to access communities.
          </p>
        </div>
      </div>
    );
  }

  // Rest of your component code
}