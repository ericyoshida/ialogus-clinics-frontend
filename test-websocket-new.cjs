const io = require('socket.io-client');

// Configuração do teste
const BACKEND_URL = 'https://ialogus-backend-deploy.onrender.com/chat';
const AUTH_TOKEN = 'ialogus:token'; // Token de teste

console.log('🧪 Testando nova implementação WebSocket...');
console.log('🌐 URL:', BACKEND_URL);
console.log('🔑 Token:', AUTH_TOKEN);

// Criar conexão com nova configuração
const socket = io(BACKEND_URL, {
  auth: {
    token: AUTH_TOKEN
  },
  transports: ['websocket'],
  autoConnect: true,
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Event listeners para novos eventos
socket.on('connect', () => {
  console.log('✅ Conectado com sucesso!');
  console.log('🆔 Socket ID:', socket.id);
  console.log('🚀 Transport:', socket.io.engine.transport.name);
});

socket.on('connection-established', (data) => {
  console.log('🔐 Conexão autenticada estabelecida:', data);
  
  // Testar entrada em sala de chat após autenticação
  setTimeout(() => {
    console.log('🧪 Testando entrada em sala de chat...');
    socket.emit('join-chat-room', { chatLogId: 'test-chat-123' });
  }, 1000);
});

socket.on('joined-chat-room', (data) => {
  console.log('🏠 Entrou na sala de chat:', data);
  
  // Testar envio de mensagem após entrar na sala
  setTimeout(() => {
    console.log('🧪 Testando envio de mensagem...');
    socket.emit('send-message', {
      chatLogId: 'test-chat-123',
      content: 'Mensagem de teste via WebSocket - ' + new Date().toLocaleTimeString()
    });
  }, 1000);
});

socket.on('message-sent', (data) => {
  console.log('✅ Confirmação de mensagem enviada:', data);
  
  // Testar saída da sala após enviar mensagem
  setTimeout(() => {
    console.log('🧪 Testando saída da sala...');
    socket.emit('leave-chat-room', { chatLogId: 'test-chat-123' });
  }, 1000);
});

socket.on('left-chat-room', (data) => {
  console.log('🚪 Saiu da sala de chat:', data);
});

socket.on('new-message', (data) => {
  console.log('🔔 Nova mensagem recebida:', data);
});

socket.on('disconnect', (reason, details) => {
  console.log('❌ Desconectado. Motivo:', reason);
  console.log('📋 Detalhes:', details);
});

socket.on('connect_error', (error) => {
  console.error('🚨 Erro de conexão:', error.message);
});

socket.on('unauthorized', (error) => {
  console.error('🔒 Falha na autenticação:', error);
});

socket.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error);
});

// Escutar todos os eventos
socket.onAny((eventName, ...args) => {
  console.log('🎯 Evento recebido:', eventName, 'com dados:', args);
});

// Manter o script rodando
setTimeout(() => {
  console.log('⏰ Teste finalizado após 30 segundos');
  socket.disconnect();
  process.exit(0);
}, 30000);

console.log('⏳ Aguardando conexão e testando funcionalidades por 30 segundos...'); 