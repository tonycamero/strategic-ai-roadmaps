import { Route, Switch, Link, useLocation, Redirect } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useSuperAdminAuthority } from '../hooks/useSuperAdminAuthority';
import { AuthorityCategory } from '@roadmap/shared';

// Pages
import SuperAdminOverviewPage from './pages/SuperAdminOverviewPage';
import SuperAdminFirmsPage from './pages/SuperAdminFirmsPage';
import SuperAdminFirmDetailPage from './pages/SuperAdminFirmDetailPage';
import SuperAdminControlPlaneFirmDetailPage from './pages/SuperAdminControlPlaneFirmDetailPage';
import SuperAdminAgentPage from './pages/SuperAdminAgentPage';
import EugeneCohortPage from './pages/EugeneCohortPage';
import SuperAdminRoadmapViewerPage from './pages/SuperAdminRoadmapViewerPage';
import SuperAdminLeadsPage from './pages/SuperAdminLeadsPage';
import SuperAdminExecutePage from './pages/SuperAdminExecutePage';

export function SuperAdminLayout() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { isSystem, isOperator, category } = useSuperAdminAuthority();

  const isActive = (path: string) => location === path || location.startsWith(path + '/');

  // Guard against System/Agent accounts accessing the UI at all if strictly enforced,
  // but predominantly just hide navigation.
  if (isSystem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-xs">
        AGENT_ACCESS_RESTRICTED_TO_API
      </div>
    );
  }

  // Human-readable Authority Label
  const getAuthorityLabel = () => {
    switch (category) {
      case AuthorityCategory.EXECUTIVE: return 'Authority: Executive';
      case AuthorityCategory.DELEGATE: return 'Authority: Delegate';
      case AuthorityCategory.OPERATOR: return 'Authority: Operator';
      default: return 'Role: Unknown';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-52 border-r border-slate-900 bg-slate-950 flex flex-col fixed inset-y-0 z-50">

        {/* Context Branding */}
        <div className="p-6 pb-4 border-b border-slate-900/50">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] ${category === AuthorityCategory.EXECUTIVE ? 'bg-purple-500 shadow-purple-500/50' : 'bg-indigo-500'
              }`}></div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-400">
              SuperAdmin
            </span>
          </div>
          <div className="font-bold text-lg tracking-tight text-slate-100">
            Strategy
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
            {user?.email}
          </div>
          <div className={`mt-2 inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide
            ${category === AuthorityCategory.EXECUTIVE
              ? 'bg-purple-900/20 border-purple-800 text-purple-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
            {getAuthorityLabel()}
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {/* SECTION 1: CORE OPERATIONAL MODES */}
          <div className="space-y-4">
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2">
              Management Plane
            </div>

            <div className="space-y-2">
              <NavItem
                href="/superadmin"
                active={location === '/superadmin'}
                icon="🛰️"
                label="Strategy"
                description="Portfolio intelligence surface"
              />

              <NavItem
                href="/superadmin/execute"
                active={isActive('/superadmin/execute')}
                icon="🛠️"
                label="Execute"
                description="Tenant orchestration plane"
              />
            </div>

            <div className="px-3 pt-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2">
              Resources
            </div>

            <div className="space-y-2">
              <NavItem
                href="/superadmin/firms"
                active={isActive('/superadmin/firms') || isActive('/superadmin/control-plane')}
                icon="🏢"
                label="Firm Directory"
                description="Entity management & state"
              />

              <NavItem
                href="/superadmin/pipeline"
                active={isActive('/superadmin/pipeline')}
                icon="📊"
                label="Cohort Pipeline"
                description="Global flow & blockage"
              />

              <NavItem
                href="/superadmin/leads"
                active={isActive('/superadmin/leads')}
                icon="👥"
                label="Webinar Leads"
                description="Intake processing queue"
              />
            </div>
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/50">
          <Link href="/dashboard">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors mb-2">
              <span>←</span> Exit to Dashboard
            </button>
          </Link>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded text-xs font-medium text-red-900/60 hover:text-red-400 hover:bg-red-900/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-52 min-w-0 bg-slate-950 relative">
        {/* Top Context Bar (Mobile/Immersive reinforcement) */}
        {!isOperator && (
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r z-40 pointer-events-none ${category === AuthorityCategory.EXECUTIVE
            ? 'from-purple-900/50 via-indigo-900/50 to-slate-900/50'
            : 'from-indigo-900/50 via-slate-800/50 to-slate-900/50'
            }`} />
        )}

        <div className="h-full">
          <Switch>

            {/* Cohort Pipeline (primary Kanban board) */}
            <Route path="/superadmin/pipeline/:cohortLabel?" component={EugeneCohortPage} />

            {/* Firms Directory (New Control Plane List) - Protected Route */}
            <Route path="/superadmin/firms">
              {isOperator ? <Redirect to="/superadmin" /> : <SuperAdminFirmsPage />}
            </Route>

            {/* EXECUTION Firm Detail (New UX) - Protected Route */}
            <Route path="/superadmin/execute/firms/:tenantId">
              {(params) => (
                isOperator
                  ? <Redirect to="/superadmin" />
                  : <SuperAdminControlPlaneFirmDetailPage />
              )}
            </Route>

            {/* LEGACY Firm Detail (Preserved for Operational Admin) */}
            <Route
              path="/superadmin/firms/:tenantId"
              component={SuperAdminFirmDetailPage}
            />

            {/* Strategy (Portfolio Overview) */}
            <Route path="/superadmin" component={SuperAdminOverviewPage} />

            {/* Execute (Tenant Orchestration) */}
            <Route path="/superadmin/execute" component={SuperAdminExecutePage} />

            {/* Leads */}
            <Route path="/superadmin/leads" component={SuperAdminLeadsPage} />

            {/* Agent Tap-In */}
            <Route path="/superadmin/agent" component={SuperAdminAgentPage} />

            {/* Supporting routes */}
            <Route
              path="/superadmin/tenant/:tenantId/roadmap"
              component={SuperAdminRoadmapViewerPage}
            />

            {/* Redirects */}
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
        </div>
      </main>
    </div >
  );
}

// Sub-component for clean nav items
function NavItem({ href, active, icon, label, description }: any) {
  return (
    <Link href={href}>
      <div className={`
                group flex items-start gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                ${active
          ? 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-sm'
          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
        }
            `}>
        <span className={`mt-0.5 text-sm ${active ? 'grayscale-0' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all'}`}>
          {icon}
        </span>
        <div>
          <div className={`text-xs font-bold leading-none mb-1 ${active ? 'text-indigo-300' : 'text-slate-300 group-hover:text-white'}`}>
            {label}
          </div>
          {description && (
            <div className="text-[9px] text-slate-600 font-medium leading-tight group-hover:text-slate-500">
              {description}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
