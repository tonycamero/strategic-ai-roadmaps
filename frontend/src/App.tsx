import { useEffect } from 'react';
import { Router, Route, Switch, useLocation, Redirect } from 'wouter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { RoadmapProvider } from './context/RoadmapContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import TransformationDashboard from './pages/owner/TransformationDashboard';
import CaseStudyViewer from './pages/CaseStudyViewer';
import AcceptInvite from './pages/AcceptInvite';
import OpsIntake from './pages/intake/OpsIntake';
import SalesIntake from './pages/intake/SalesIntake';
import DeliveryIntake from './pages/intake/DeliveryIntake';
import OwnerIntake from './pages/intake/OwnerIntake';
import { LeadershipSummaryPage } from './pages/owner/LeadershipSummaryPage';
import AgentInbox from './pages/owner/AgentInbox';
import { SuperAdminLayout } from './superadmin/SuperAdminLayout';
import RoadmapViewer from './pages/RoadmapViewer';
import TicketModeration from './components/TicketModeration';
import Onepager from './pages/Onepager';
import BusinessProfile from './pages/BusinessProfile';
import OrganizationType from './pages/OrganizationType';
import InviteTeam from './pages/InviteTeam';
import TeamIntakesReview from './pages/TeamIntakesReview';
import DiagnosticReview from './pages/DiagnosticReview';
import DiscoveryCallScheduler from './pages/DiscoveryCallScheduler';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPassword from './pages/ResetPassword';
import { OnboardingLayout } from './layouts/OnboardingLayout';
import { TrustAgentShell as SmartShell } from './trustagent/TrustAgentShell';
import { Webinar } from './pages/Webinar';
import RoleEvidenceRender from './pages/render/RoleEvidenceRender';
import SmbSales from './pages/public/SmbSales';
import AuthorityEconomics from './pages/public/AuthorityEconomics';
import AuthorityPartner from './pages/public/AuthorityPartner';
import CertifiedOperator from './pages/public/CertifiedOperator';
import Features from './pages/public/Features';

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function HomepageTrustAgent() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Only show on public marketing routes when NOT authenticated
  const isPublicMarketingRoute =
    location === '/' ||
    location === '/home' ||
    location === '/cohort' ||
    location === '/ai' ||
    location === '/eugene-2026';

  if (isAuthenticated || !isPublicMarketingRoute) return null;

  return (
    <SmartShell enabled={true} />
  );
}

function PortalTrustAgent() {
  const { isAuthenticated, user } = useAuth();

  // Hide for unauthenticated or superadmin users
  if (!isAuthenticated || user?.role === 'superadmin') return null;

  return (
    <SmartShell enabled={true} agentType="roadmap" />
  );
}


function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <OnboardingProvider>
          <RoadmapProvider>
            <Router>
              <ScrollToTop />
              {/* Public homepage agent for non-authenticated users */}
              <HomepageTrustAgent />
              {/* Portal TrustAgent for authenticated owners */}
              <PortalTrustAgent />
              <Switch>
                <Route path="/" component={LandingPage} />
                <Route path="/smb" component={SmbSales} />
                <Route path="/economics" component={AuthorityEconomics} />
                <Route path="/partner" component={AuthorityPartner} />
                <Route path="/operator" component={CertifiedOperator} />
                <Route path="/features" component={Features} />
                <Route path="/__render/role-evidence" component={RoleEvidenceRender} />

                {/* Legacy Redirects */}
                <Route path="/ai">{() => { window.location.href = '/'; return null; }}</Route>
                <Route path="/home">{() => { window.location.href = '/'; return null; }}</Route>
                <Route path="/cohort">{() => { window.location.href = '/'; return null; }}</Route>
                <Route path="/eugene-2026">{() => { window.location.href = '/'; return null; }}</Route>

                <Route path="/onepager" component={Onepager} />
                <Route path="/diagnostic" component={Webinar} />
                <Route path="/login" component={Auth} />
                <Route path="/signup" component={Signup} />
                <Route path="/request-reset" component={RequestPasswordReset} />
                <Route path="/reset-password/:token" component={ResetPassword} />
                <Route path="/accept-invite/:token" component={AcceptInvite} />

                {/* Onboarding routes with persistent Journey Sidebar */}
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

                {/* Non-onboarding routes (no sidebar) */}
                <ProtectedRoute path="/owner/transformation" component={TransformationDashboard} />
                <ProtectedRoute path="/owner/summary" component={LeadershipSummaryPage} />
                <ProtectedRoute path="/agents/inbox" component={AgentInbox} />
                <ProtectedRoute path="/case-study/:docId" component={CaseStudyViewer} />

                <ProtectedRoute path="/superadmin/firms/:tenantId/case-study/:docId" component={CaseStudyViewer} />
                <ProtectedRoute path="/superadmin/tickets/:tenantId/:diagnosticId" component={TicketModeration} />
                <ProtectedRoute path="/superadmin" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/execute" component={SuperAdminLayout} />

                {/* Redirects for legacy semantic names */}
                <Route path="/superadmin/command-center">
                  <Redirect to="/superadmin/execute" />
                </Route>
                <Route path="/superadmin/strategy-center">
                  <Redirect to="/superadmin" />
                </Route>

                <ProtectedRoute path="/superadmin/roadmaps" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/firms" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/execute/firms/:tenantId" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/firms/:tenantId" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/leads" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/agent" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/tenant/:tenantId/roadmap" component={SuperAdminLayout} />
                <ProtectedRoute path="/superadmin/pipeline/:cohortLabel?" component={SuperAdminLayout} />

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
