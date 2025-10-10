'use client';

import { useState, useEffect } from 'react';
import { useOrg } from '@/lib/client/contexts/OrgContext';
import { createClient } from '@/lib/client';

interface BrandingConfig {
  id?: string;
  org_id: string;
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
  custom_js: string;
  is_active: boolean;
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
}

export default function BrandingCustomizer() {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [themePresets, setThemePresets] = useState<ThemePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const { currentOrg } = useOrg();
  const supabase = createClient();

  const fonts = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Source Sans Pro',
    'Nunito'
  ];

  useEffect(() => {
    if (currentOrg) {
      fetchBrandingData();
    }
  }, [currentOrg]);

  const fetchBrandingData = async () => {
    try {
      // Fetch current config
      const configResponse = await fetch(`/api/white-label/config?orgId=${currentOrg?.id}`);
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfig(configData.id ? configData : {
          org_id: currentOrg?.id,
          brand_name: currentOrg?.name || '',
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          accent_color: '#10B981',
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          font_family: 'Inter',
          logo_url: '',
          favicon_url: '',
          custom_css: '',
          custom_js: '',
          is_active: true
        });
      }

      // Fetch theme presets
      const { data: presets } = await supabase
        .from('theme_presets')
        .select('*')
        .eq('is_public', true);

      setThemePresets(presets || []);
    } catch (error) {
      console.error('Error fetching branding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/white-label/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const savedConfig = await response.json();
        setConfig(savedConfig);
        alert('Branding configuration saved successfully!');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (preset: ThemePreset) => {
    setConfig(prev => prev ? {
      ...prev,
      primary_color: preset.primary_color,
      secondary_color: preset.secondary_color,
      accent_color: preset.accent_color,
      background_color: preset.background_color,
      text_color: preset.text_color,
      font_family: preset.font_family
    } : null);
  };

  const handlePresetKeyDown = (event: React.KeyboardEvent, preset: ThemePreset) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      applyPreset(preset);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6">
      {/* Preview Toggle */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Branding Preview</h2>
          <button
            onClick={() => setPreview(!preview)}
            className={`px-4 py-2 rounded-md ${
              preview ? 'bg-gray-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {preview ? 'Close Preview' : 'Show Preview'}
          </button>
        </div>
        
        {preview && (
          <div 
            className="mt-4 p-6 rounded-lg border-2 border-dashed border-gray-300"
            style={{
              backgroundColor: config.background_color,
              color: config.text_color,
              fontFamily: config.font_family
            }}
          >
            <div className="text-center">
              {config.logo_url && (
                <img 
                  src={config.logo_url} 
                  alt="Logo" 
                  className="h-12 mx-auto mb-4"
                />
              )}
              <h3 className="text-2xl font-bold mb-2" style={{ color: config.primary_color }}>
                {config.brand_name || 'Your Brand'}
              </h3>
              <p className="mb-4">Welcome to your customized academy</p>
              <div className="flex justify-center space-x-4">
                <button 
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: config.primary_color }}
                >
                  Primary Button
                </button>
                <button 
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: config.secondary_color }}
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Theme Presets */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Theme Presets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themePresets.map(preset => (
            <button
              key={preset.id}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow text-left w-full"
              onClick={() => applyPreset(preset)}
              onKeyDown={(e) => handlePresetKeyDown(e, preset)}
            >
              <div className="flex space-x-2 mb-3">
                <div 
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: preset.primary_color }}
                ></div>
                <div 
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: preset.secondary_color }}
                ></div>
                <div 
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: preset.accent_color }}
                ></div>
              </div>
              <h3 className="font-semibold">{preset.name}</h3>
              <p className="text-sm text-gray-600">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Branding Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Branding Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div>
            <label htmlFor="brand-name" className="block text-sm font-medium mb-2">
              Brand Name
            </label>
            <input
              id="brand-name"
              type="text"
              value={config.brand_name}
              onChange={(e) => setConfig({ ...config, brand_name: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="Your Brand Name"
            />
          </div>

          <div>
            <label htmlFor="font-family" className="block text-sm font-medium mb-2">
              Font Family
            </label>
            <select
              id="font-family"
              value={config.font_family}
              onChange={(e) => setConfig({ ...config, font_family: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              {fonts.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          {/* Colors */}
          <div>
            <label htmlFor="primary-color" className="block text-sm font-medium mb-2">
              Primary Color
            </label>
            <div className="flex space-x-2">
              <input
                id="primary-color"
                type="color"
                value={config.primary_color}
                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                className="w-12 h-10"
                aria-label="Primary color picker"
              />
              <input
                type="text"
                value={config.primary_color}
                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                className="flex-1 p-2 border rounded-md font-mono text-sm"
                aria-label="Primary color hex value"
              />
            </div>
          </div>

          <div>
            <label htmlFor="secondary-color" className="block text-sm font-medium mb-2">
              Secondary Color
            </label>
            <div className="flex space-x-2">
              <input
                id="secondary-color"
                type="color"
                value={config.secondary_color}
                onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                className="w-12 h-10"
                aria-label="Secondary color picker"
              />
              <input
                type="text"
                value={config.secondary_color}
                onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                className="flex-1 p-2 border rounded-md font-mono text-sm"
                aria-label="Secondary color hex value"
              />
            </div>
          </div>

          <div>
            <label htmlFor="accent-color" className="block text-sm font-medium mb-2">
              Accent Color
            </label>
            <div className="flex space-x-2">
              <input
                id="accent-color"
                type="color"
                value={config.accent_color}
                onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                className="w-12 h-10"
                aria-label="Accent color picker"
              />
              <input
                type="text"
                value={config.accent_color}
                onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                className="flex-1 p-2 border rounded-md font-mono text-sm"
                aria-label="Accent color hex value"
              />
            </div>
          </div>

          <div>
            <label htmlFor="background-color" className="block text-sm font-medium mb-2">
              Background Color
            </label>
            <div className="flex space-x-2">
              <input
                id="background-color"
                type="color"
                value={config.background_color}
                onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                className="w-12 h-10"
                aria-label="Background color picker"
              />
              <input
                type="text"
                value={config.background_color}
                onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                className="flex-1 p-2 border rounded-md font-mono text-sm"
                aria-label="Background color hex value"
              />
            </div>
          </div>

          <div>
            <label htmlFor="text-color" className="block text-sm font-medium mb-2">
              Text Color
            </label>
            <div className="flex space-x-2">
              <input
                id="text-color"
                type="color"
                value={config.text_color}
                onChange={(e) => setConfig({ ...config, text_color: e.target.value })}
                className="w-12 h-10"
                aria-label="Text color picker"
              />
              <input
                type="text"
                value={config.text_color}
                onChange={(e) => setConfig({ ...config, text_color: e.target.value })}
                className="flex-1 p-2 border rounded-md font-mono text-sm"
                aria-label="Text color hex value"
              />
            </div>
          </div>

          {/* Custom CSS */}
          <div className="md:col-span-2">
            <label htmlFor="custom-css" className="block text-sm font-medium mb-2">
              Custom CSS
            </label>
            <textarea
              id="custom-css"
              value={config.custom_css}
              onChange={(e) => setConfig({ ...config, custom_css: e.target.value })}
              className="w-full p-2 border rounded-md font-mono text-sm"
              rows={6}
              placeholder="Add custom CSS styles here..."
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}