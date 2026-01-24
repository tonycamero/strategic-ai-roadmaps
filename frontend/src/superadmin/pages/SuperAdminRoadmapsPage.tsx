import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function SuperAdminRoadmapsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/superadmin/firms');
  }, [setLocation]);

  return null;
}
