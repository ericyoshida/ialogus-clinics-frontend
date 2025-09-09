import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Componente que verifica o status de autenticação e redireciona o usuário
 * para o dashboard se estiver autenticado ou para a página de login se não estiver.
 */
export const HomeRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log('HomeRedirect - Verificando autenticação', {
      path: location.pathname,
      isAuthenticated,
      isLoading
    });
  }, [isAuthenticated, isLoading, location]);
  
  // Enquanto verifica a autenticação, mostra indicador de carregamento
  if (isLoading) {
    console.log('HomeRedirect - Carregando...');
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  
  // Redireciona com base no status de autenticação
  if (isAuthenticated) {
    console.log('HomeRedirect - Usuário autenticado, redirecionando para /dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('HomeRedirect - Usuário não autenticado, redirecionando para /auth/login');
    return <Navigate to="/auth/login" replace />;
  }
}; 