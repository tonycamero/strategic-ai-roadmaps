import { useEffect } from 'react';
import { Router, Route, Switch, useLocation } from 'wouter';
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

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function RootRedirect() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (location !== '/') return;
    setLocation(isAuthenticated ? '/dashboard' : '/login', { replace: true });
  }, [location, isAuthenticated, setLocation]);

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
                  <OnboardingLayout><Dashboard /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/organization-type">
                  <OnboardingLayout><OrganizationType /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/business-profile">
                  <OnboardingLayout><BusinessProfile /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/invite-team">
                  <OnboardingLayout><InviteTeam /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/owner">
                  <OnboardingLayout><OwnerIntake /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/ops">
                  <OnboardingLayout><OpsIntake /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/sales">
                  <OnboardingLayout><SalesIntake /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/delivery">
                  <OnboardingLayout><DeliveryIntake /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/intake/exec_sponsor">
                  <OnboardingLayout><ExecutiveIntake /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/team-intakes">
                  <OnboardingLayout><TeamIntakesReview /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/diagnostic-review">
                  <OnboardingLayout><DiagnosticReview /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/discovery-call">
                  <OnboardingLayout><DiscoveryCallScheduler /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/roadmap">
                  <OnboardingLayout><RoadmapViewer /></OnboardingLayout>
                </ProtectedRoute>

                <ProtectedRoute path="/owner/case-study/:docId">
                  <OnboardingLayout><CaseStudyViewer /></OnboardingLayout>
                </ProtectedRoute>

                {/* Non-onboarding */}
                <ProtectedRoute path="/owner/transformation" component={TransformationDashboard} />
                <ProtectedRoute path="/owner/summary" component={LeadershipSummaryPage} />
                <ProtectedRoute path="/agents/inbox" component={AgentInbox} />
                <ProtectedRoute path="/case-study/:docId" component={CaseStudyViewer} />

                {/* Superadmin */}
                <ProtectedRoute path="/superadmin" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/roadmaps" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/firms" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/firms/:tenantId" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/execute" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/execute/firms/:tenantId" component={SuperAdminLayout} />

                <ProtectedRoute path="/superadmin/leads" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/agent" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/tenant/:tenantId/roadmap" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/pipeline" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/firms/:tenantId/case-study/:docId" component={CaseStudyViewer} />
                <ProtectedRoute path="/superadmin/tickets/:tenantId/:diagnosticId" component={TicketModeration} />



                {/* 404 */}
                <Route>
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600">Page not found</p>
                    </div>
                  </div>
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
