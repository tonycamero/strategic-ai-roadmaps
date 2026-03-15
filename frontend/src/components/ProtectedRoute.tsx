import { Route, Redirect, RouteProps } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps extends RouteProps {
  component?: React.ComponentType<any>;
  children?: ReactNode;
  requireRole?: string; // NEW
}

export default function ProtectedRoute({ component: Component, children, requireRole, ...rest }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Route {...rest}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
              <div className="text-slate-400">Loading...</div>
            </div>
          );
        }
        
        if (!isAuthenticated) {
  const next = encodeURIComponent(
    window.location.pathname + window.location.search + window.location.hash
  );
  return <Redirect to={`/login?reason=unauthorized&next=${next}`} />;
}
        const userRole = user?.role?.toLowerCase();
        const requiredRole = requireRole?.toLowerCase();
        
        // Superadmin bypass (EXEC-078G)
        if (userRole === 'superadmin' || userRole === 'super_admin') {
          if (Component) return <Component {...params} />;
          return <>{children}</>;
        }

        if (requireRole) {
          console.log('DEBUG: ProtectedRoute check:', { path: rest.path, userRole, requiredRole });
          
          const isSuperAdminMatch = (requiredRole === 'superadmin' || requiredRole === 'super_admin') && 
                                   (userRole === 'superadmin' || userRole === 'super_admin');
          
          if (userRole !== requiredRole && !isSuperAdminMatch) {
            console.log('DEBUG: ProtectedRoute bounce to /dashboard');
            return <Redirect to="/dashboard" />;
          }
        }

        // Support either component prop or children
        if (Component) {
          return <Component {...params} />;
        }
        
        return <>{children}</>;
      }}
    </Route>
  );
}
