import { api } from '.';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Interface para o usuário
export interface User {
  id: string;
  name: string;
  email: string;
  plan?: string;
  role?: string;
}

// Formato que recebemos da API
interface ApiAuthResponse {
  access_token: string;
  user?: User;
}

// Formato que usamos internamente
interface AuthResponse {
  token: string;
  user: User;
}

// Chaves usadas no localStorage
const TOKEN_KEY = 'ialogus:token';
const USER_KEY = 'ialogus:user';

// Converte a resposta da API para o formato interno
const formatApiResponse = (apiResponse: ApiAuthResponse): AuthResponse => {
  console.log('=== FORMATANDO RESPOSTA DA API ===');
  console.log('Resposta da API (raw):', JSON.stringify(apiResponse, null, 2));
  console.log('access_token existe:', !!apiResponse.access_token);
  console.log('user existe na resposta:', !!apiResponse.user);
  
  // Se a API não retornar um objeto user, criamos um com base no token (payload do JWT)
  if (!apiResponse.user && apiResponse.access_token) {
    console.log('=== USUÁRIO NÃO FORNECIDO PELA API - EXTRAINDO DO TOKEN ===');
    // Extrair dados do usuário do token JWT
    try {
      const tokenParts = apiResponse.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Payload extraído do token:', JSON.stringify(payload, null, 2));
        
        // Criando objeto de usuário a partir do payload do JWT
        const userFromToken = {
          id: payload.sub || payload.id || 'unknown',
          name: payload.name || 'Usuário',
          email: payload.email || '',
          role: payload.role
        };
        
        console.log('Usuário criado a partir do token:', JSON.stringify(userFromToken, null, 2));
        
        return {
          token: apiResponse.access_token,
          user: userFromToken
        };
      }
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
    }
  }
  
  // Se a API forneceu dados do usuário, usar eles
  if (apiResponse.user) {
    console.log('=== USUÁRIO FORNECIDO PELA API ===');
    console.log('Dados do usuário da API:', JSON.stringify(apiResponse.user, null, 2));
  }
  
  // Retornamos o formato esperado
  const result = {
    token: apiResponse.access_token,
    user: apiResponse.user || {
      id: 'unknown',
      name: 'Usuário',
      email: ''
    }
  };
  
  console.log('=== RESULTADO FORMATADO ===');
  console.log('Resultado final:', JSON.stringify(result, null, 2));
  
  return result;
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  console.log('Enviando requisição de login para a API');
  const response = await api.post('/sessions', credentials);
  console.log('Resposta da API (login):', response.data);
  return formatApiResponse(response.data);
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  console.log('Enviando requisição de registro para a API');
  const response = await api.post('/accounts', data);
  console.log('Resposta da API (registro):', response.data);
  return formatApiResponse(response.data);
};

export const saveAuthData = (data: AuthResponse): void => {
  console.log('=== SALVANDO DADOS DE AUTENTICAÇÃO ===');
  console.log('Dados recebidos para salvar:', JSON.stringify(data, null, 2));
  
  if (!data || !data.token) {
    console.error('Dados de autenticação inválidos:', data);
    return;
  }
  
  try {
    localStorage.setItem(TOKEN_KEY, data.token);
    console.log('Token salvo no localStorage');
    
    if (data.user) {
      console.log('Dados do usuário para salvar:', JSON.stringify(data.user, null, 2));
      console.log('Nome do usuário:', data.user.name);
      console.log('Email do usuário:', data.user.email);
      console.log('ID do usuário:', data.user.id);
      
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      console.log('Usuário salvo no localStorage');
      
      // Armazenar o userId separadamente para facilitar o acesso
      if (data.user.id) {
        localStorage.setItem('userId', data.user.id);
        console.log('userId salvo no localStorage:', data.user.id);
      }
    }
    
    console.log('=== DADOS SALVOS COM SUCESSO ===');
  } catch (error) {
    console.error('Erro ao salvar dados no localStorage:', error);
  }
};

export const getAuthData = (): { token: string | null; user: User | null } => {
  try {
    console.log('=== RECUPERANDO DADOS DE AUTENTICAÇÃO ===');
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    
    console.log('Token existe no localStorage:', !!token);
    console.log('String do usuário existe no localStorage:', !!userStr);
    console.log('String do usuário (raw):', userStr);
    
    let user = null;
    if (userStr) {
      user = JSON.parse(userStr);
      console.log('=== USUÁRIO RECUPERADO DO LOCALSTORAGE ===');
      console.log('Usuário completo:', JSON.stringify(user, null, 2));
      console.log('Nome do usuário:', user?.name);
      console.log('Email do usuário:', user?.email);
      console.log('ID do usuário:', user?.id);
    } else if (token) {
      console.log('=== TENTANDO EXTRAIR USUÁRIO DO TOKEN JWT ===');
      // Se temos um token mas não temos dados do usuário, vamos tentar extrair do JWT
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Payload do JWT:', JSON.stringify(payload, null, 2));
          
          user = {
            id: payload.sub || payload.id || 'unknown',
            name: payload.name || 'Usuário',
            email: payload.email || '',
            role: payload.role
          };
          console.log('Usuário criado a partir do JWT:', JSON.stringify(user, null, 2));
          // Salvar o usuário no localStorage para futuras consultas
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          console.log('Usuário salvo no localStorage para futuras consultas');
        }
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    } else {
      console.log('=== NENHUM DADO DE AUTENTICAÇÃO ENCONTRADO ===');
    }
    
    console.log('=== RESULTADO FINAL ===');
    console.log('Token retornado:', !!token);
    console.log('Usuário retornado:', JSON.stringify(user, null, 2));
    
    return { token, user };
  } catch (error) {
    console.error('=== ERRO AO RECUPERAR DADOS ===', error);
    // Em caso de erro, remove os dados potencialmente corrompidos
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { token: null, user: null };
  }
};

export const clearAuthData = (): void => {
  console.log('Limpando dados de autenticação');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('userId');
};

// Função para verificar se o userId está disponível
export const hasUserId = (): boolean => {
  const userId = localStorage.getItem('userId');
  return !!userId;
};

// Função para obter o userId
export const getUserId = (): string | null => {
  return localStorage.getItem('userId');
};

// Verificar e sincronizar o userId se existir dados do usuário mas não o userId
export const syncUserId = (): void => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          localStorage.setItem('userId', user.id);
          console.log('userId sincronizado a partir do objeto user:', user.id);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar userId:', error);
    }
  }
}; 

// Função para buscar dados do perfil do usuário
export const getUserProfile = async () => {
  console.log('[getUserProfile] Iniciando busca do perfil do usuário');
  try {
    const response = await api.get('/user/profile');
    console.log('[getUserProfile] Resposta da API:', response.data);
    return response.data;
  } catch (error) {
    console.error('[getUserProfile] Erro ao buscar perfil:', error);
    throw error;
  }
};

// Função para salvar dados do usuário (sem token)
export const saveUserData = (userData: User) => {
  console.log('[saveUserData] Salvando dados do usuário:', userData);
  try {
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('[saveUserData] Dados do usuário salvos com sucesso');
  } catch (error) {
    console.error('[saveUserData] Erro ao salvar dados do usuário:', error);
  }
}; 