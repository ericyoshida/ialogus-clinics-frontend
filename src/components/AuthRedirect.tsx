import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Componente que verifica se o usuário está autenticado e o redireciona para o dashboard
 * caso esteja. Utilizado nas rotas de autenticação (login, registro) para impedir
 * que usuários já autenticados acessem essas páginas.
 */
export const AuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log('AuthRedirect - Verificando autenticação', {
      path: location.pathname,
      isAuthenticated,
      isLoading
    });
  }, [isAuthenticated, isLoading, location]);
  
  // Enquanto verifica a autenticação, mostra indicador de carregamento
  if (isLoading) {
    console.log('AuthRedirect - Carregando...');
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  
  // Se estiver autenticado, redireciona para o dashboard
  if (isAuthenticated) {
    console.log('AuthRedirect - Usuário autenticado, redirecionando para /dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  // Se não estiver autenticado, renderiza as rotas filhas normalmente
  console.log('AuthRedirect - Usuário não autenticado, exibindo página de autenticação');
  return <Outlet />;
}; 