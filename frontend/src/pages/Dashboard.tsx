import { useAuth } from '../context/AuthContext';
import DashboardV6 from './owner/DashboardV6';
import TeamMemberDashboard from './team/TeamMemberDashboard';

/**
 * Role-aware dashboard router
 * Directs users to appropriate dashboard based on their role
 */
export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Owner gets full dashboard with roadmap, tickets, team status
  if (user.role === 'owner') {
    return <DashboardV6 />;
  }

  // Team members (ops, sales, delivery) get simplified view
  if (['ops', 'sales', 'delivery'].includes(user.role)) {
    return <TeamMemberDashboard />;
  }

  // Staff or other roles - redirect to intake or show minimal view
  return <TeamMemberDashboard />;
}
