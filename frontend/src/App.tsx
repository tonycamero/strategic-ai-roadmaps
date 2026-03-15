import { useEffect } from 'react';
import { Router, Route, Switch, useLocation, Redirect } from 'wouter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { RoadmapProvider } from './context/RoadmapContext';
import ProtectedRoute from './components/ProtectedRoute';

import Auth from './pages/Auth';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import TransformationDashboard from './pages/owner/TransformationDashboard';
import CaseStudyViewer from './pages/CaseStudyViewer';
import AcceptInvite from './pages/AcceptInvite';
import OpsIntake from './pages/intake/OpsIntake';
import SalesIntake from './pages/intake/SalesIntake';
import DeliveryIntake from './pages/intake/DeliveryIntake';
import OwnerIntake from './pages/intake/OwnerIntake';
import ExecutiveIntake from './pages/intake/ExecutiveIntake';
import { LeadershipSummaryPage } from './pages/owner/LeadershipSummaryPage';
import AgentInbox from './pages/owner/AgentInbox';
import { SuperAdminLayout } from './superadmin/SuperAdminLayout';
import RoadmapViewer from './pages/RoadmapViewer';
import TicketModeration from './components/TicketModeration';
import BusinessProfile from './pages/BusinessProfile';
import ExecutiveConsole from './pages/executive/ExecutiveConsole';
import ExecConsolePage from './pages/executive/ExecConsolePage';
import OrganizationType from './pages/OrganizationType';
import InviteTeam from './pages/InviteTeam';
import TeamIntakesReview from './pages/TeamIntakesReview';
import ClarificationForm from './pages/clarify/ClarificationForm';
import DiagnosticReview from './pages/DiagnosticReview';
import DiscoveryCallScheduler from './pages/DiscoveryCallScheduler';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPassword from './pages/ResetPassword';
import { OnboardingLayout } from './layouts/OnboardingLayout';
import { TrustAgentShell as SmartShell } from './trustagent/TrustAgentShell';
import { resolveRoute } from './lib/roleResolver';

// Operational Surfaces
import ExecutionOpsPage from './pages/ops/ExecutionOpsPage';
import ExceptionsOpsPage from './pages/ops/ExceptionsOpsPage';
import CoordinationOpsPage from './pages/ops/CoordinationOpsPage';

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function RootRedirect() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Only redirect if at the root path (/)
    // This allows deep links (like previews) to persist without being
    // forced to the role-based home.
    if (location !== '/' && location !== '/login' && location !== '/auth') {
      return;
    }

    if (!isAuthenticated || !user) {
      setLocation('/login', { replace: true });
      return;
    }

    // Delegate to Role Resolver for the correct operational home
    const doResolve = async () => {
      const route = await resolveRoute(user as any, user?.tenantId || 'demo');
      setLocation(route, { replace: true });
    };

    doResolve();

  }, [isAuthenticated, user, setLocation, location]);

  return null;
}

function PortalTrustAgent() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || user?.role === 'superadmin') return null;

  return <SmartShell enabled={true} agentType="roadmap" />;
}

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <OnboardingProvider>
          <RoadmapProvider>
            <Router>
              <ScrollToTop />
              <RootRedirect />
              <PortalTrustAgent />

              <Switch>
                {/* Auth */}
                <Route path="/login" component={Auth} />
                <Route path="/auth" component={Auth} />
                <Route path="/signup" component={Signup} />

                {/* Canonical password reset routes */}
                <Route path="/request-reset" component={RequestPasswordReset} />
                <Route path="/reset-password" component={ResetPassword} />

                {/* Back-compat (optional but recommended) */}
                <Route path="/forgot-password" component={RequestPasswordReset} />
                <Route path="/reset-password/:token" component={ResetPassword} />

                <Route path="/clarify/:token" component={ClarificationForm} />
                <Route path="/accept-invite/:token" component={AcceptInvite} />

                {/* Onboarding (with sidebar) */}
                <ProtectedRoute path="/dashboard">
                  <OnboardingLayout>
                    <Dashboard />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/organization-type">
                  <OnboardingLayout>
                    <OrganizationType />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/business-profile">
                  <OnboardingLayout>
                    <BusinessProfile />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/invite-team">
                  <OnboardingLayout>
                    <InviteTeam />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/owner">
                  <OnboardingLayout>
                    <OwnerIntake />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/ops">
                  <OnboardingLayout>
                    <OpsIntake />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/sales">
                  <OnboardingLayout>
                    <SalesIntake />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/delivery">
                  <OnboardingLayout>
                    <DeliveryIntake />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/exec_sponsor">
                  <OnboardingLayout>
                    <ExecutiveIntake />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/team-intakes">
                  <OnboardingLayout>
                    <TeamIntakesReview />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/diagnostic-review">
                  <OnboardingLayout>
                    <DiagnosticReview />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/discovery-call">
                  <OnboardingLayout>
                    <DiscoveryCallScheduler />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/roadmap">
                  <OnboardingLayout>
                    <RoadmapViewer />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/journey">
                  <OnboardingLayout>
                    <RoadmapViewer />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/owner/case-study/:docId">
                  <OnboardingLayout>
                    <CaseStudyViewer />
                  </OnboardingLayout>
                </ProtectedRoute>

                {/* Non-onboarding */}
                <ProtectedRoute path="/executive">
                  <OnboardingLayout>
                    <ExecutiveConsole />
                  </OnboardingLayout>
                </ProtectedRoute>

                {/* AG-TICKET-EXEC-ROUTE: Decisional pilot surface */}
                <ProtectedRoute path="/exec/:tenantId">
                  <OnboardingLayout>
                    <ExecConsolePage />
                  </OnboardingLayout>
                </ProtectedRoute>
                
                <ProtectedRoute path="/exec">
                  <OnboardingLayout>
                    <ExecConsolePage />
                  </OnboardingLayout>
                </ProtectedRoute>
                <ProtectedRoute path="/owner/transformation">
                  <OnboardingLayout>
                    <TransformationDashboard />
                  </OnboardingLayout>
                </ProtectedRoute>

                {/* Pilot Operational Surfaces */}
                <ProtectedRoute path="/ops/execution">
                  <OnboardingLayout>
                    <ExecutionOpsPage />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/ops/exceptions">
                  <OnboardingLayout>
                    <ExceptionsOpsPage />
                  </OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/ops/coordination">
                  <OnboardingLayout>
                    <CoordinationOpsPage />
                  </OnboardingLayout>
                </ProtectedRoute>
                <ProtectedRoute path="/owner/summary" component={LeadershipSummaryPage} />
                <ProtectedRoute path="/agents/inbox" component={AgentInbox} />
                <ProtectedRoute path="/case-study/:docId" component={CaseStudyViewer} />

                {/* Superadmin */}
                <ProtectedRoute path="/superadmin" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/roadmaps" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/firms" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/firms/:tenantId" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/execute" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/execute/firms/:tenantId" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/leads" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/agent" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/tenant/:tenantId/roadmap" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/pipeline" component={SuperAdminLayout} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/firms/:tenantId/case-study/:docId" component={CaseStudyViewer} requireRole="superadmin" />
                <ProtectedRoute path="/superadmin/tickets/:tenantId/:diagnosticId" component={TicketModeration} requireRole="superadmin" />

                {/* Global Fallback / 404 */}
                <Route>
                  <Redirect to="/dashboard" />
                </Route>
              </Switch>
            </Router>
          </RoadmapProvider>
        </OnboardingProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
