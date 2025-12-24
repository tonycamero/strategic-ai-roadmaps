import { ReactNode } from 'react';
import { JourneySidebar } from '../components/dashboard/JourneySidebar';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Persistent Journey Sidebar */}
      <JourneySidebar />
      
      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
