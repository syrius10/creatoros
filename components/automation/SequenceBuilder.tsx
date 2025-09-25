'use client';

import { useState } from 'react';
import { useOrg } from '@/lib/client/contexts/OrgContext';

export default function SequenceBuilder() {
  const [sequence, setSequence] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [steps, setSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentOrg } = useOrg();

  const addStep = (type: 'email' | 'delay') => {
    const newStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      step_order: steps.length + 1,
      action_type: type,
      delay_days: type === 'delay' ? 1 : undefined,
      config: {}
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (stepId: string, updates: any) => {
    const newSteps = steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    );
    setSteps(newSteps);
  };

  const removeStep = (stepId: string) => {
    const newSteps = steps.filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, step_order: index + 1 }));
    setSteps(newSteps);
  };

  const saveSequence = async () => {
    if (!currentOrg) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/automations/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sequence, steps })
      });

      if (!response.ok) throw new Error('Failed to create sequence');

      // Reset form
      setSequence({ name: '', description: '', is_active: true });
      setSteps([]);
      alert('Sequence created successfully!');
    } catch (error) {
      console.error('Error creating sequence:', error);
      alert('Failed to create sequence');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate unique IDs for form controls
  const sequenceNameId = 'sequence-name';
  const sequenceDescId = 'sequence-description';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Create Email Sequence</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor={sequenceNameId} className="block text-sm font-medium text-gray-700 mb-1">
            Sequence Name
          </label>
          <input
            id={sequenceNameId}
            type="text"
            value={sequence.name}
            onChange={(e) => setSequence({ ...sequence, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Welcome Sequence"
          />
        </div>

        <div>
          <label htmlFor={sequenceDescId} className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id={sequenceDescId}
            value={sequence.description}
            onChange={(e) => setSequence({ ...sequence, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe this sequence"
            rows={3}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => addStep('email')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Email Step
          </button>
          <button
            onClick={() => addStep('delay')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Add Delay
          </button>
        </div>

        {steps.map((step) => {
          const stepSubjectId = `step-${step.id}-subject`;
          const stepContentId = `step-${step.id}-content`;
          const stepDelayId = `step-${step.id}-delay`;

          return (
            <div key={step.id} className="border rounded-md p-4 mb-3 relative">
              <button
                onClick={() => removeStep(step.id)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                type="button"
              >
                Remove
              </button>
              
              <h3 className="font-medium mb-2">Step {step.step_order}: {step.action_type}</h3>
              
              {step.action_type === 'email' && (
                <div className="space-y-2">
                  <div>
                    <label htmlFor={stepSubjectId} className="block text-sm font-medium text-gray-700 mb-1">
                      Email Subject
                    </label>
                    <input
                      id={stepSubjectId}
                      type="text"
                      placeholder="Email Subject"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      onChange={(e) => updateStep(step.id, { config: { ...step.config, subject: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label htmlFor={stepContentId} className="block text-sm font-medium text-gray-700 mb-1">
                      Email Content
                    </label>
                    <textarea
                      id={stepContentId}
                      placeholder="Email Content"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={4}
                      onChange={(e) => updateStep(step.id, { config: { ...step.config, content: e.target.value } })}
                    />
                  </div>
                </div>
              )}

              {step.action_type === 'delay' && (
                <div>
                  <label htmlFor={stepDelayId} className="block text-sm font-medium text-gray-700 mb-1">
                    Delay (days)
                  </label>
                  <input
                    id={stepDelayId}
                    type="number"
                    value={step.delay_days || 1}
                    onChange={(e) => updateStep(step.id, { delay_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={saveSequence}
        disabled={isLoading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Sequence'}
      </button>
    </div>
  );
}