'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { Organization } from '@/types/database';

interface OrgContextType {
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
  userOrgs: Organization[];
  setUserOrgs: (orgs: Organization[]) => void;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

interface OrgProviderProps {
  readonly children: ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentOrg,
    setCurrentOrg,
    userOrgs,
    setUserOrgs,
    isLoading
  }), [currentOrg, userOrgs, isLoading]);

  useEffect(() => {
    // Load the user's organizations from localStorage or API
    const loadUserOrgs = async () => {
      try {
        // Check if localStorage is available (client-side)
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }
        
        // Check if we have orgs in localStorage
        const savedOrgs = localStorage.getItem('userOrganizations');
        const savedCurrentOrg = localStorage.getItem('currentOrganization');
        
        if (savedOrgs) {
          setUserOrgs(JSON.parse(savedOrgs));
        }
        
        if (savedCurrentOrg) {
          setCurrentOrg(JSON.parse(savedCurrentOrg));
        } else if (savedOrgs && JSON.parse(savedOrgs).length > 0) {
          // Set the first org as current if none is selected
          setCurrentOrg(JSON.parse(savedOrgs)[0]);
        }
        
        // You might want to fetch from API here to ensure data is fresh
        // const response = await fetch('/api/user/organizations');
        // if (response.ok) {
        //   const orgs = await response.json();
        //   setUserOrgs(orgs);
        //   if (orgs.length > 0 && !currentOrg) {
        //     setCurrentOrg(orgs[0]);
        //   }
        // }
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserOrgs();
  }, []);

  useEffect(() => {
    // Save to localStorage when organizations change
    if (typeof window === 'undefined') return;
    
    if (userOrgs.length > 0) {
      localStorage.setItem('userOrganizations', JSON.stringify(userOrgs));
    }
    
    if (currentOrg) {
      localStorage.setItem('currentOrganization', JSON.stringify(currentOrg));
    }
  }, [userOrgs, currentOrg]);

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