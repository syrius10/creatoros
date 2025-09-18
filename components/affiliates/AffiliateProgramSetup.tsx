'use client';

import { useState } from 'react';
import { useOrg } from '@/lib/client/contexts/OrgContext';

export default function AffiliateProgramSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commission_rate: '',
    cookie_duration: '30',
    terms: ''
  });
  const { currentOrg } = useOrg();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/affiliates/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          commission_rate: parseFloat(formData.commission_rate)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create affiliate program');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        commission_rate: '',
        cookie_duration: '30',
        terms: ''
      });

      // Show success message
      alert('Affiliate program created successfully!');
    } catch (error) {
      console.error('Error creating affiliate program:', error);
      alert('Failed to create affiliate program');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Create Affiliate Program</h2>
        <p className="text-gray-600">
          Set up a new affiliate program for your products
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Program Name
          </label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Summer Promotion"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your affiliate program"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700 mb-1">
            Commission Rate (%)
          </label>
          <input
            id="commission_rate"
            name="commission_rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.commission_rate}
            onChange={handleChange}
            required
            placeholder="e.g., 15.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="cookie_duration" className="block text-sm font-medium text-gray-700 mb-1">
            Cookie Duration (Days)
          </label>
          <input
            id="cookie_duration"
            name="cookie_duration"
            type="number"
            min="1"
            value={formData.cookie_duration}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">
            Terms & Conditions
          </label>
          <textarea
            id="terms"
            name="terms"
            value={formData.terms}
            onChange={handleChange}
            placeholder="Add terms and conditions for your affiliates"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Program'}
        </button>
      </form>
    </div>
  );
}