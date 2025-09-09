import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  redirectPath?: string;
}

/**
 * Component that protects routes requiring authentication.
 * If the user is not authenticated, they are redirected to the specified path.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/auth/login',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log('ProtectedRoute - Verificando autenticação', {
      path: location.pathname,
      isAuthenticated,
      isLoading
    });
  }, [isAuthenticated, isLoading, location]);

  // Show nothing while checking authentication status
  if (isLoading) {
    console.log('ProtectedRoute - Carregando...');
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Usuário não autenticado, redirecionando para', redirectPath);
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  // If authenticated, render the children routes
  console.log('ProtectedRoute - Usuário autenticado, exibindo rota protegida');
  return <Outlet />;
}; 