'use client';

import { useState, useEffect } from 'react';
import { useOrg } from '@/lib/client/contexts/OrgContext';
import { createClient } from '@/lib/client';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: string;
  confidence: number;
  reason: string;
}

interface LearningPath {
  id: string;
  name: string;
  progress: number;
  estimated_hours: number;
}

export default function PersonalizedDashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { currentOrg } = useOrg();
  const supabase = createClient();

  // Get user from Supabase auth instead of OrgContext
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    if (currentUser && currentOrg) {
      fetchPersonalizedData();
    }
  }, [currentUser, currentOrg]);

  const fetchPersonalizedData = async () => {
    try {
      // Fetch recommendations
      const recResponse = await fetch(`/api/ai/recommendations?userId=${currentUser?.id}&limit=5`);
      if (recResponse.ok) {
        const recs = await recResponse.json();
        setRecommendations(recs);
      }

      // Fetch learning paths
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      setLearningPaths(paths || []);
    } catch (error) {
      console.error('Error fetching personalized data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createLearningPath = async (goals: string[]) => {
    if (!currentOrg || !currentUser) return;

    try {
      const response = await fetch('/api/ai/learning-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals,
          orgId: currentOrg.id,
          skills: [] // You can add current user skills here
        })
      });

      if (response.ok) {
        fetchPersonalizedData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating learning path:', error);
    }
  };

  const quickCreateLearningPath = () => {
    const sampleGoals = [
      'Improve technical skills',
      'Learn new programming languages',
      'Build portfolio projects',
      'Prepare for career advancement'
    ];
    
    // Fixed: Use spread operator to create a copy, then sort the copy
    const shuffledGoals = [...sampleGoals].sort(() => 0.5 - Math.random());
    const randomGoals = shuffledGoals.slice(0, 2);
    
    createLearningPath(randomGoals);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Recommendations Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Paths Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 ml-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
        <p className="text-gray-500 mb-4">Please sign in to view personalized recommendations and learning paths.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendations Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recommended for You</h2>
          <button
            onClick={fetchPersonalizedData}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-gray-500 mb-2">No recommendations yet</p>
            <p className="text-sm text-gray-400">Complete some courses to get personalized recommendations</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {Math.round(rec.confidence * 100)}% match
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                <p className="text-xs text-gray-500">{rec.reason}</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {rec.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learning Paths Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Learning Paths</h2>
          <div className="flex space-x-2">
            <button
              onClick={quickCreateLearningPath}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm transition-colors"
            >
              Create AI Path
            </button>
          </div>
        </div>
        
        {learningPaths.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 mb-4">No learning paths yet</p>
            <button
              onClick={quickCreateLearningPath}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Learning Path
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {learningPaths.map((path) => (
              <div key={path.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">{path.name}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {path.estimated_hours} hours
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${path.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Progress</span>
                  <span>{path.progress}% complete</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}