'use client';

import { OrgProvider } from '@/lib/client/contexts/OrgContext';

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <OrgProvider>
      {children}
    </OrgProvider>
  );
}