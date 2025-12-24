import { Route, Switch, Link, useLocation, Redirect } from 'wouter';
import { useAuth } from '../context/AuthContext';
import SuperAdminOverviewPage from './pages/SuperAdminOverviewPage';
import SuperAdminFirmsPage from './pages/SuperAdminFirmsPage';
import SuperAdminFirmDetailPage from './pages/SuperAdminFirmDetailPage';
import SuperAdminAgentPage from './pages/SuperAdminAgentPage';
import EugeneCohortPage from './pages/EugeneCohortPage';
import SuperAdminRoadmapViewerPage from './pages/SuperAdminRoadmapViewerPage';
import SuperAdminLeadsPage from './pages/SuperAdminLeadsPage';

export function SuperAdminLayout() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-64 border-r border-slate-800 p-4 flex flex-col gap-4">
        <div className="font-semibold text-lg tracking-tight">
          SA • Strategic AI
        </div>
        <div className="text-xs text-slate-500">
          {user?.name} • {user?.email}
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/superadmin">
            <span
              className={`px-2 py-1 rounded block cursor-pointer ${isActive('/superadmin') ? 'bg-slate-800' : 'hover:bg-slate-900'
                }`}
            >
              Command Center
            </span>
          </Link>
          <Link href="/superadmin/pipeline">
            <span
              className={`px-2 py-1 rounded block cursor-pointer ${location.startsWith('/superadmin/pipeline')
                  ? 'bg-slate-800'
                  : 'hover:bg-slate-900'
                }`}
            >
              Cohort Pipeline
            </span>
          </Link>
          <Link href="/superadmin/firms">
            <span
              className={`px-2 py-1 rounded block cursor-pointer ${isActive('/superadmin/firms')
                  ? 'bg-slate-800'
                  : 'hover:bg-slate-900'
                }`}
            >
              Firms
            </span>
          </Link>
          <Link href="/superadmin/leads">
            <span
              className={`px-2 py-1 rounded block cursor-pointer ${isActive('/superadmin/leads')
                  ? 'bg-slate-800'
                  : 'hover:bg-slate-900'
                }`}
            >
              Webinar Registrations
            </span>
          </Link>
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-800">
          <Link href="/dashboard">
            <span className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer block">
              ← Back to Dashboard
            </span>
          </Link>
          <button
            onClick={logout}
            className="mt-2 w-full text-xs text-left text-slate-400 hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Switch>
          {/* Command Center */}
          <Route path="/superadmin" component={SuperAdminOverviewPage} />

          {/* Cohort Pipeline (primary Kanban board) */}
          <Route path="/superadmin/pipeline" component={EugeneCohortPage} />

          {/* Firms Directory */}
          <Route path="/superadmin/firms" component={SuperAdminFirmsPage} />
          <Route
            path="/superadmin/firms/:tenantId"
            component={SuperAdminFirmDetailPage}
          />

          {/* Leads */}
          <Route path="/superadmin/leads" component={SuperAdminLeadsPage} />

          {/* Agent Tap-In (no sidebar nav, only quick action entry) */}
          <Route path="/superadmin/agent" component={SuperAdminAgentPage} />

          {/* Supporting routes */}
          <Route
            path="/superadmin/tenant/:tenantId/roadmap"
            component={SuperAdminRoadmapViewerPage}
          />

          {/* Legacy routes → redirect to new pipeline path */}
          <Route path="/superadmin/cohort-pipeline">
            <Redirect to="/superadmin/pipeline" />
          </Route>
          <Route path="/superadmin/cohorts/eugene-q1-2026">
            <Redirect to="/superadmin/pipeline" />
          </Route>
          <Route path="/superadmin/roadmaps">
            <Redirect to="/superadmin/firms" />
          </Route>
        </Switch>
      </main>
    </div>
  );
}
