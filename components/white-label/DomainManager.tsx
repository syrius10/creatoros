'use client';

import { useState, useEffect } from 'react';
import { useOrg } from '@/lib/client/contexts/OrgContext';

interface CustomDomain {
  id: string;
  domain_name: string;
  status: 'pending' | 'active' | 'failed';
  ssl_status: 'pending' | 'active' | 'error';
  verification_token: string;
  dns_records: any[];
  last_verified_at: string;
  verified_at: string;
  created_at: string;
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  status: string;
}

export default function DomainManager() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { currentOrg } = useOrg();

  useEffect(() => {
    if (currentOrg) {
      fetchDomains();
    }
  }, [currentOrg]);

  const fetchDomains = async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/white-label/domains?orgId=${currentOrg.id}`);
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim() || !currentOrg) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/white-label/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain_name: newDomain.trim(),
          org_id: currentOrg.id
        })
      });

      if (response.ok) {
        const domain = await response.json();
        setDomains(prev => [domain, ...prev]);
        setNewDomain('');
        alert('Domain added successfully! Please verify DNS configuration.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add domain');
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      alert('Error adding domain');
    } finally {
      setIsAdding(false);
    }
  };

  const verifyDomain = async (domainId: string) => {
    try {
      const response = await fetch(`/api/white-label/domains/${domainId}/verify`, {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok && result.verified) {
        alert('Domain verified successfully!');
        fetchDomains(); // Refresh the list
      } else {
        alert(`Verification failed: ${result.message}`);
        // Update DNS records display
        fetchDomains();
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      alert('Error verifying domain');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  // Generate a unique key for DNS records
  const getDnsRecordKey = (record: DnsRecord, domainId: string) => {
    return `${domainId}-${record.type}-${record.name}-${record.value}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={`skeleton-${i}`} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Domain Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Add Custom Domain</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="yourdomain.com"
            className="flex-1 p-2 border rounded-md"
            disabled={isAdding}
          />
          <button
            onClick={addDomain}
            disabled={isAdding || !newDomain.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add Domain'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Add your custom domain to brand your academy. You'll need to configure DNS settings after adding.
        </p>
      </div>

      {/* Domain List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Your Domains</h2>
        
        {domains.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No domains configured yet. Add your first domain above.
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map(domain => (
              <div key={domain.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{domain.domain_name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(domain.status)}
                      {domain.ssl_status && getStatusBadge(`SSL: ${domain.ssl_status}`)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {domain.status === 'pending' && (
                      <button
                        onClick={() => verifyDomain(domain.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>

                {/* DNS Records */}
                {domain.status === 'pending' && domain.dns_records && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="font-medium mb-2">DNS Configuration Required:</h4>
                    <div className="space-y-2 text-sm">
                      {domain.dns_records.map((record: DnsRecord) => (
                        <div key={getDnsRecordKey(record, domain.id)} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-mono">{record.type} {record.name}</span>
                            <span className="mx-2">→</span>
                            <span className="font-mono">{record.value}</span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            record.status === 'verified' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Add these DNS records to your domain provider. Verification may take up to 24 hours.
                    </p>
                  </div>
                )}

                {/* Verification Token */}
                {domain.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="font-medium mb-2">Verification Token:</h4>
                    <code className="block p-2 bg-gray-100 rounded text-sm font-mono break-all">
                      {domain.verification_token}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}