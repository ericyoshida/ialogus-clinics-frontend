import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadStoredAuth = async () => {
    try {
      console.log('=== INÍCIO: Verificando autenticação armazenada ===');
      authService.syncUserId();
      
      const { token, user } = authService.getAuthData();
      
      console.log('=== DADOS RECUPERADOS ===');
      console.log('Token encontrado:', !!token);
      console.log('Usuário encontrado:', !!user);
      console.log('UserId disponível:', authService.hasUserId());
      console.log('Dados completos do usuário:', JSON.stringify(user, null, 2));
      console.log('Token completo (primeiros 50 chars):', token ? token.substring(0, 50) + '...' : 'null');
      
      if (token) {
        if (user && user.name && user.email) {
          // Se já temos dados completos do usuário, use-os
          console.log('=== USUÁRIO COMPLETO ENCONTRADO ===');
          console.log('Usuário autenticado:', JSON.stringify(user, null, 2));
          setUser(user);
        } else {
          // Se temos apenas o token, busque os dados do usuário na API
          console.log('=== TOKEN ENCONTRADO, BUSCANDO DADOS DO USUÁRIO ===');
          try {
            const profileResponse = await authService.getUserProfile();
            console.log('Dados do perfil obtidos da API:', profileResponse);
            
            // Atualizar os dados armazenados
            authService.saveUserData(profileResponse);
            setUser(profileResponse);
            console.log('Dados do usuário atualizados com sucesso');
          } catch (profileError) {
            console.error('Erro ao buscar perfil do usuário:', profileError);
            console.log('Token pode estar inválido, fazendo logout');
            authService.clearAuthData();
            setUser(null);
          }
        }
      } else {
        console.log('=== NENHUM TOKEN ENCONTRADO ===');
        setUser(null);
      }
      console.log('=== FIM: Verificação de autenticação concluída ===');
    } catch (error) {
      console.error('=== ERRO: Falha ao carregar dados de autenticação ===', error);
      setUser(null);
    } finally {
      console.log('=== FINALIZANDO: Definindo loading como false ===');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Iniciando login com:', { email });
      
      const response = await authService.login({ email, password });
      console.log('Resposta do login:', response);
      
      authService.saveAuthData(response);
      setUser(response.user);
      
      toast({
        title: "Login realizado",
        description: "Você foi autenticado com sucesso.",
      });
      
      console.log('Redirecionando para o dashboard após login');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Erro durante login:', error);
      let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente.";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status: number; data?: { message?: string } } };
        if (apiError.response) {
          if (apiError.response.status === 401) {
            errorMessage = "Email ou senha incorretos.";
          } else if (apiError.response.data?.message) {
            errorMessage = apiError.response.data.message;
          }
        }
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Iniciando registro com:', { name, email });
      
      const response = await authService.register({ name, email, password });
      console.log('Resposta do registro:', response);
      
      authService.saveAuthData(response);
      setUser(response.user);
      
      toast({
        title: "Cadastro realizado",
        description: "Sua conta foi criada com sucesso.",
      });
      
      console.log('Redirecionando para o dashboard após registro');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Erro durante registro:', error);
      let errorMessage = "Ocorreu um erro ao criar sua conta. Tente novamente.";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status: number; data?: { message?: string } } };
        if (apiError.response) {
          if (apiError.response.status === 400 && apiError.response.data?.message) {
            errorMessage = apiError.response.data.message;
          }
        }
      }
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Realizando logout');
    authService.clearAuthData();
    setUser(null);
    navigate('/auth/login');
  };

  console.log('Estado atual da autenticação:', {
    isAuthenticated: !!user,
    isLoading,
    userExists: !!user
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    console.error('useAuth - Contexto não encontrado. Certifique-se de que o componente está dentro do AuthProvider.');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('useAuth - Contexto retornado:', {
    hasContext: !!context,
    hasLogin: !!context?.login,
    hasUser: !!context?.user,
    isAuthenticated: context?.isAuthenticated,
    isLoading: context?.isLoading
  });
  
  return context;
}; 