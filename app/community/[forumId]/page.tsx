'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useOrg } from '@/lib/client/contexts/OrgContext';
import { Thread } from '@/lib/community';

export default function ForumPage() {
  const params = useParams();
  const { currentOrg } = useOrg();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });

  const forumId = params.forumId as string;

  useEffect(() => {
    if (currentOrg?.id && forumId) {
      fetchThreads();
    }
  }, [currentOrg?.id, forumId]);

  const fetchThreads = async () => {
    try {
      const response = await fetch(`/api/community/forums/${forumId}/threads`);
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/community/forums/${forumId}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: currentOrg?.id,
          title: newThread.title,
          content: newThread.content,
        }),
      });

      if (response.ok) {
        setNewThread({ title: '', content: '' });
        setShowCreateForm(false);
        fetchThreads(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/community" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to forums
          </Link>
          <h1 className="text-3xl font-bold">Forum Threads</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Thread
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Thread</h2>
          <form onSubmit={handleCreateThread}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={newThread.title}
                onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={newThread.content}
                onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Thread
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {threads.map((thread) => (
          <div key={thread.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">
                  <Link href={`/community/thread/${thread.id}`} className="hover:text-blue-600">
                    {thread.is_pinned && (
                      <span className="text-yellow-500 mr-2">📌</span>
                    )}
                    {thread.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{thread.content}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>By {thread.user?.full_name || thread.user?.email}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span>{thread.comment_count} comments</span>
                  <span className="mx-2">•</span>
                  <span>{thread.reaction_count} reactions</span>
                </div>
              </div>
              {thread.is_locked && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                  Locked
                </span>
              )}
            </div>
          </div>
        ))}

        {threads.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No threads yet</h3>
            <p className="text-gray-500 mb-4">Be the first to start a discussion in this forum.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Start a Discussion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}