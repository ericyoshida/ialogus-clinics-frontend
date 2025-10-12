const io = require('socket.io-client');

// Configuração do teste
const BACKEND_URL = 'https://ialogus-backend-deploy.onrender.com';
const AUTH_TOKEN = 'ialogus:token'; // Token de teste

console.log('🧪 Testando conexão WebSocket...');
console.log('🌐 URL:', BACKEND_URL);
console.log('🔑 Token:', AUTH_TOKEN);

// Criar conexão
const socket = io(BACKEND_URL, {
  auth: {
    token: AUTH_TOKEN
  },
  query: {
    token: AUTH_TOKEN
  },
  extraHeaders: {
    'Authorization': `Bearer ${AUTH_TOKEN}`
  },
  timeout: 20000,
  forceNew: true,
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: false,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Event listeners
socket.on('connect', () => {
  console.log('✅ Conectado com sucesso!');
  console.log('🆔 Socket ID:', socket.id);
  console.log('🚀 Transport:', socket.io.engine.transport.name);
});

socket.on('disconnect', (reason, details) => {
  console.log('❌ Desconectado. Motivo:', reason);
  console.log('📋 Detalhes:', details);
});

socket.on('connect_error', (error) => {
  console.error('🚨 Erro de conexão:', error.message);
});

socket.on('authenticated', () => {
  console.log('🔐 Autenticado com sucesso!');
});

socket.on('unauthorized', (error) => {
  console.error('🔒 Falha na autenticação:', error);
});

// Escutar todos os eventos
socket.onAny((eventName, ...args) => {
  console.log('🎯 Evento recebido:', eventName, 'com dados:', args);
});

// Escutar especificamente o evento new-message
socket.on('new-message', (data) => {
  console.log('💬 Nova mensagem recebida:', data);
});

// Manter o script rodando
setTimeout(() => {
  console.log('⏰ Teste finalizado após 30 segundos');
  socket.disconnect();
  process.exit(0);
}, 30000);

console.log('⏳ Aguardando conexão por 30 segundos...'); 