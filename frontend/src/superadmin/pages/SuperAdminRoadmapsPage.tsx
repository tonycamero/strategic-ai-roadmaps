import { useEffect } from 'react';
import { useLocation } from 'wouter';

// This view has been folded into Firm details and Command Center.
// Redirecting to Firms page.
export default function SuperAdminRoadmapsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/superadmin/firms');
  }, [setLocation]);

  return null;
}
