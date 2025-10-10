'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

interface BrandingConfig {
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
}

interface BrandingContextType {
  config: BrandingConfig | null;
  isLoading: boolean;
}

interface BrandingProviderProps {
  children: React.ReactNode;
  orgId?: string;
  domain?: string;
}

const BrandingContext = createContext<BrandingContextType>({
  config: null,
  isLoading: true
});

export function BrandingProvider({ 
  children,
  orgId,
  domain 
}: Readonly<BrandingProviderProps>) {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const params = new URLSearchParams();
        if (orgId) params.append('orgId', orgId);
        if (domain) params.append('domain', domain);

        const response = await fetch(`/api/white-label/config?${params}`);
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, [orgId, domain]);

  // Apply custom CSS
  useEffect(() => {
    if (config?.custom_css) {
      const styleElement = document.createElement('style');
      styleElement.textContent = config.custom_css;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [config?.custom_css]);

  // Apply favicon
  useEffect(() => {
    if (config?.favicon_url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = config.favicon_url;
      document.head.appendChild(link);
    }
  }, [config?.favicon_url]);

  const contextValue = useMemo(() => ({
    config,
    isLoading
  }), [config, isLoading]);

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);