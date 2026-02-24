import { Route, Redirect, RouteProps } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps extends RouteProps {
  component?: React.ComponentType<any>;
  children?: ReactNode;
}

export default function ProtectedRoute({ component: Component, children, ...rest }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

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
        
        // Support either component prop or children
        if (Component) {
          return <Component {...params} />;
        }
        
        return <>{children}</>;
      }}
    </Route>
  );
}
