'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useOrg } from '@/lib/client/contexts/OrgContext';

export default function CommunityClient() {
  const [forums, setForums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { currentOrg, loading: orgLoading } = useOrg();

  useEffect(() => {
    async function loadForums() {
      if (!currentOrg) return;
      
      try {
        const { data: forumsData, error } = await supabase
          .from('forums')
          .select('*, orgs(name)')
          .eq('org_id', currentOrg.id)
          .order('position', { ascending: true });

        if (error) {
          console.error('Error loading forums:', error);
          return;
        }

        setForums(forumsData || []);
      } catch (error) {
        console.error('Error in loadForums:', error);
      } finally {
        setIsLoading(false);
      }
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

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading forums...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Community Forums</h1>
      
      <div className="grid gap-6">
        {forums.map(forum => (
          <div key={forum.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  <Link 
                    href={`/community/${forum.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {forum.name}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4">{forum.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {forum.orgs.name}
                  </span>
                  {forum.is_private && (
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Private
                    </span>
                  )}
                </div>
              </div>
              
              <Link
                href={`/community/${forum.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Forum
              </Link>
            </div>
          </div>
        ))}
        
        {forums.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-500">No forums available</h2>
            <p className="text-gray-400 mt-2">
              There are no forums in this organization yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}