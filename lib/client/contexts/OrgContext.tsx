'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabaseServer';

// Define proper TypeScript interfaces
interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  // Add other properties as needed
}

interface OrgContextType {
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
  userOrgs: Organization[];
  loading: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

interface OrgProviderProps {
  readonly children: React.ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function loadUserOrgs() {
      try {
        const client = await supabase;
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: memberships, error } = await client
          .from('org_members')
          .select('org_id, orgs(*)')
          .eq('profile_id', user.id);

        if (error) {
          console.error('Error loading memberships:', error);
          return;
        }

        if (memberships) {
          // The actual response structure is different from OrgMember interface
          const orgs = memberships.map((m: any) => m.orgs);
          // Filter out any null values and ensure they are Organization objects
          const validOrgs = orgs.filter((org: unknown): org is Organization => 
            org !== null && typeof org === 'object' && 'id' in org
          );
          setUserOrgs(validOrgs);
          if (validOrgs.length > 0 && !currentOrg) {
            setCurrentOrg(validOrgs[0]);
          }
        }
      } catch (error) {
        console.error('Error loading user orgs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserOrgs();
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentOrg,
    setCurrentOrg,
    userOrgs,
    loading
  }), [currentOrg, userOrgs, loading]);

  return (
    <OrgContext.Provider value={contextValue}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}