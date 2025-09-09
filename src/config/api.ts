// Configuração da API
export const API_CONFIG = {
  // Use a variável de ambiente se disponível, senão use a URL de produção
  baseURL: import.meta.env.VITE_API_URL || 'https://ialogus-deploy-api.onrender.com',
  timeout: 30000,
}

// Configuração do WebSocket
export const WS_CONFIG = {
  baseURL: import.meta.env.VITE_WS_URL || 'https://ialogus-deploy-api.onrender.com',
}

// Log das configurações (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('API Config:', API_CONFIG)
  console.log('WebSocket Config:', WS_CONFIG)
}