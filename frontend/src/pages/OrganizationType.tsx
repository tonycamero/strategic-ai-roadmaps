import { useLocation } from 'wouter';
import { OrganizationTypeStep } from '../components/onboarding/OrganizationTypeStep';
import { useTenant } from '../context/TenantContext';
import type { BusinessType } from '@roadmap/shared';

export default function OrganizationType() {
  const [, setLocation] = useLocation();
  const { tenant } = useTenant();

  const handleContinue = () => {
    // After selecting organization type, go to business profile
    setLocation('/business-profile');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <OrganizationTypeStep 
          onContinue={handleContinue}
          initialBusinessType={(tenant?.businessType as BusinessType) || 'default'}
        />
      </div>
    </div>
  );
}
