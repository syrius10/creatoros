'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOrg } from '@/lib/client/contexts/OrgContext';
import { Forum } from '@/lib/community';

export default function CommunityPage() {
  const { currentOrg } = useOrg();
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg?.id) {
      fetchForums();
    }
  }, [currentOrg?.id]);

  const fetchForums = async () => {
    try {
      const response = await fetch(`/api/community/forums?orgId=${currentOrg?.id}`);
      if (response.ok) {
        const data = await response.json();
        setForums(data);
      }
    } catch (error) {
      console.error('Error fetching forums:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Community Forums</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          New Forum
        </button>
      </div>

      <div className="grid gap-6">
        {forums.map((forum) => (
          <div key={forum.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">
                  <Link href={`/community/${forum.id}`} className="hover:text-blue-600">
                    {forum.name}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4">{forum.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{forum.thread_count} threads</span>
                  {forum.latest_thread && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Latest: {forum.latest_thread.title}</span>
                    </>
                  )}
                </div>
              </div>
              {forum.is_private && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                  Private
                </span>
              )}
            </div>
          </div>
        ))}

        {forums.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forums yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first community forum.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Create Forum
            </button>
          </div>
        )}
      </div>
    </div>
  );
}