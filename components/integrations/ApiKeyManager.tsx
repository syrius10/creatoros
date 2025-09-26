'use client';

import { useState, useEffect } from 'react';
import { useOrg } from '@/lib/client/contexts/OrgContext';
import { createClient } from '@/lib/client';
import { API_SCOPES } from '@/lib/apiKeyUtils';

interface ApiKey {
  id: string;
  name: string;
  description: string;
  scopes: string[];
  rate_limit_per_minute: number;
  is_active: boolean;
  last_used_at: string;
  expires_at: string;
  created_at: string;
}

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKey, setNewKey] = useState({
    name: '',
    description: '',
    scopes: [] as string[],
    rate_limit_per_minute: 60,
    expires_in_days: 30
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentOrg } = useOrg();
  const supabase = createClient();

  const fetchApiKeys = async () => {
    if (!currentOrg) return;
    
    setLoading(true);
    const response = await fetch(`/api/integrations/api-keys?orgId=${currentOrg.id}`);
    
    if (response.ok) {
      const keys = await response.json();
      setApiKeys(keys);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApiKeys();
  }, [currentOrg]);

  const createApiKey = async () => {
    if (!currentOrg) return;
    
    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + newKey.expires_in_days);

      const response = await fetch('/api/integrations/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newKey,
          expires_at: expiresAt.toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedKey(result.api_key);
        setShowCreateForm(false);
        setNewKey({
          name: '',
          description: '',
          scopes: [],
          rate_limit_per_minute: 60,
          expires_in_days: 30
        });
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    }
    setLoading(false);
  };

  const revokeApiKey = async (keyId: string) => {
    if (!currentOrg) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (!error) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
    }
    setLoading(false);
  };

  const toggleScope = (scope: string) => {
    setNewKey(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">API Keys</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create New Key
        </button>
      </div>

      {generatedKey && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-bold text-green-800">API Key Created!</h3>
          <p className="text-green-700 text-sm mt-1">
            Save this key securely. You won't be able to see it again.
          </p>
          <code className="block mt-2 p-2 bg-green-100 text-green-800 rounded break-all">
            {generatedKey}
          </code>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 p-4 border rounded-md">
          <h3 className="font-bold mb-4">Create New API Key</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="api-key-name" className="block text-sm font-medium mb-1">Name</label>
              <input
                id="api-key-name"
                type="text"
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Production API Key"
              />
            </div>

            <div>
              <label htmlFor="api-key-description" className="block text-sm font-medium mb-1">Description</label>
              <textarea
                id="api-key-description"
                value={newKey.description}
                onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="What will this key be used for?"
                rows={3}
              />
            </div>

            <div>
              <fieldset>
                <legend className="block text-sm font-medium mb-2">Permissions</legend>
                <div className="space-y-2">
                  {Object.entries(API_SCOPES).map(([key, scope]) => (
                    <label key={scope} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newKey.scopes.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="mr-2"
                      />
                      <span className="text-sm">{scope}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={createApiKey}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Create Key
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {apiKeys.map(key => (
          <div key={key.id} className="p-4 border rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{key.name}</h3>
                <p className="text-sm text-gray-600">{key.description}</p>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </span>
                </div>
              </div>
              {key.is_active && (
                <button
                  onClick={() => revokeApiKey(key.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}