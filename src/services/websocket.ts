import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  content: string;
  isFromCustomer: boolean;
  createdAt: string;
  updatedAt?: string;
  chatLogId: string;
  contactId?: string;
  customerName?: string;
  customerPhone?: string;
  channelName?: string;
}

export interface NewMessageData {
  id: string;
  content: string;
  isFromCustomer: boolean;
  createdAt: string;
  chatLogId: string;
  contactId: string;
  customerName: string;
  customerPhone: string;
  channelName: string;
  leadTemperature?: number;
  messageType?: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaFilename?: string;
  mediaOriginalFilename?: string;
  mediaMimeType?: string;
  mediaUrl?: string;
}

export interface MessageSentData {
  chatLogId: string;
  content: string;
  timestamp: string;
  success: boolean;
}

export interface ConnectionEstablishedData {
  connectionId: string;
  userId: string;
  timestamp: string;
}

export interface SendMessagePayload {
  chatLogId: string;
  content: string;
}

export interface JoinChatRoomPayload {
  chatLogId: string;
}

export interface LeaveChatRoomPayload {
  chatLogId: string;
}

export interface WhatsappServiceWindowData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  hasActiveWhatsappServiceWindow: boolean;
  whatsappServiceWindowStartedAt: string | null;
  whatsappServiceWindowExpiresAt: string | null;
  status: 'opened' | 'closed';
  timestamp: string;
}

type EventCallback = (data: unknown) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: Map<string, EventCallback[]> = new Map();
  private currentChatLogId: string | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isTabVisible: boolean = true;

  constructor() {
    console.log('🔧 Criando instância singleton do WebSocketService');
    // Não conectar automaticamente na criação
    // A conexão será feita quando o componente for montado e houver token
    this.setupVisibilityHandlers();
  }

  public connect() {
    console.log('🚀 Inicializando WebSocket Service...');
    
    const token = localStorage.getItem('ialogus:token');
    console.log('🔑 Verificando token:', token ? 'Token encontrado' : 'Token não encontrado');
    console.log('🔑 Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');
    
    if (!token) {
      console.error('❌ Token de autenticação não encontrado');
      return;
    }

    console.log('🔌 Iniciando conexão WebSocket...');
    console.log('🌐 URL:', 'https://ialogus-backend-deploy.onrender.com/chat');
    console.log('🔧 Configurações:', {
      auth: { token: token.substring(0, 10) + '...' },
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket = io('https://ialogus-backend-deploy.onrender.com/chat', {
      auth: {
        token: token
      },
      transports: ['polling', 'websocket'], // Polling primeiro para ambientes com proxy
      autoConnect: true,
      timeout: 30000, // Aumentar timeout para 30s
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // Aumentar delay máximo
      randomizationFactor: 0.5,
      pingInterval: 25000, // Aumentar ping interval para 25s
      pingTimeout: 20000, // Aumentar ping timeout para 20s
      upgrade: true,
      rememberUpgrade: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Conexão básica estabelecida
    this.socket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket');
      console.log('🆔 Socket ID:', this.socket?.id);
      console.log('🚀 Transport:', this.socket?.io.engine.transport.name);
      this.isConnected = true;
      this.notifyListeners('connect', { connected: true });
      
      // Iniciar ping manual para manter conexão ativa
      this.startPingInterval();
      
      // Re-entrar na sala atual se existir
      if (this.currentChatLogId) {
        console.log('🔄 Re-entrando na sala após reconexão:', this.currentChatLogId);
        this.socket?.emit('join-chat-room', { chatLogId: this.currentChatLogId });
      }
    });

    // Conexão autenticada estabelecida
    this.socket.on('connection-established', (data: ConnectionEstablishedData) => {
      console.log('🔐 Conexão autenticada estabelecida:', data);
      this.notifyListeners('connection-established', data);
    });

    // Confirmação de mensagem enviada
    this.socket.on('message-sent', (data: MessageSentData) => {
      console.log('✅ Mensagem enviada com sucesso:', data);
      this.notifyListeners('message-sent', data);
    });

    // Nova mensagem recebida
    this.socket.on('new-message', (data: NewMessageData) => {
      console.log('🔔 Nova mensagem recebida:', data);
      this.handleNewMessage(data);
      this.notifyListeners('new-message', data);
    });

    // Confirmação de entrada em sala
    this.socket.on('joined-chat-room', (data: { chatLogId: string }) => {
      console.log('🏠 Entrou na sala de chat:', data.chatLogId);
      this.notifyListeners('joined-chat-room', data);
    });

    // Confirmação de saída de sala
    this.socket.on('left-chat-room', (data: { chatLogId: string }) => {
      console.log('🚪 Saiu da sala de chat:', data.chatLogId);
      this.notifyListeners('left-chat-room', data);
    });

    // Desconexão
    this.socket.on('disconnect', (reason, details) => {
      console.log('❌ Desconectado do WebSocket');
      console.log('📋 Motivo da desconexão:', reason);
      console.log('📋 Detalhes da desconexão:', details);
      this.isConnected = false;
      // Não limpar currentChatLogId para poder re-entrar na sala após reconexão
      this.notifyListeners('disconnect', { connected: false, reason, details });
      
      // Parar ping interval
      this.stopPingInterval();
      
      // Reconexão automática para qualquer tipo de desconexão
      if (reason !== 'io client disconnect' && this.isTabVisible) {
        console.log('🔄 Tentando reconectar automaticamente...');
        this.scheduleReconnect();
      }
    });

    // Erros de conexão
    this.socket.on('connect_error', (error) => {
      console.error('🚨 Erro de conexão WebSocket:', error);
      console.error('🚨 Tipo do erro:', error.constructor.name);
      console.error('🚨 Mensagem do erro:', error.message);
      
      // Verificar se é erro de autenticação
      if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        console.error('🔒 Erro de autenticação - token pode estar inválido');
        this.notifyListeners('authentication-error', { error });
      }
      
      this.notifyListeners('connect_error', { error });
    });

    // Falha de autorização
    this.socket.on('unauthorized', (error) => {
      console.error('🔒 Falha na autenticação WebSocket:', error);
      this.notifyListeners('unauthorized', { error });
    });

    // Erros gerais
    this.socket.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error);
      
      // Verificar tipos específicos de erro
      if (error.message && error.message.includes('not found')) {
        console.error('🔍 Chat log não encontrado');
        this.notifyListeners('chat-not-found', { error });
      }
      
      this.notifyListeners('error', error);
    });

    // Eventos de teste (manter para compatibilidade)
    this.socket.on('test-notification', (data) => {
      console.log('🧪 Notificação de teste:', data);
      this.notifyListeners('test-notification', data);
    });

    this.socket.on('broadcast-message', (data) => {
      console.log('📢 Mensagem broadcast:', data);
      this.notifyListeners('broadcast-message', data);
    });

    // Status da janela de atendimento do WhatsApp
    this.socket.on('whatsapp-service-window-status', (data: WhatsappServiceWindowData) => {
      console.log('🟦 Status da janela de atendimento WhatsApp:', data);
      this.notifyListeners('whatsapp-service-window-status', data);
    });

    // Log de todos os eventos para debug
    this.socket.onAny((event, data) => {
      console.log('📡 Evento WebSocket recebido:', event, data);
    });

    // Função de teste manual disponível no window
    (window as unknown as { testWebSocket: () => void }).testWebSocket = () => {
      if (this.socket?.connected) {
        console.log('🧪 WebSocket conectado:', {
          id: this.socket.id,
          transport: this.socket.io.engine.transport.name,
          currentRoom: this.currentChatLogId
        });
        
        // Teste de envio de mensagem se estiver em uma sala
        if (this.currentChatLogId) {
          this.sendMessage(this.currentChatLogId, 'Teste via WebSocket - ' + new Date().toLocaleTimeString());
        } else {
          console.log('ℹ️ Não está em nenhuma sala de chat');
        }
      } else {
        console.log('❌ WebSocket não conectado');
      }
    };
  }

  private handleNewMessage(messageData: NewMessageData) {
    this.showNotification(messageData);
    this.playNotificationSound();
  }

  private showNotification(messageData: NewMessageData) {
    const notification = {
      title: `Nova mensagem de ${messageData.customerName}`,
      body: messageData.content,
      icon: '/chat-icon.png'
    };

    if (Notification.permission === 'granted') {
      new Notification(notification.title, notification);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(notification.title, notification);
        }
      });
    }
  }

  private playNotificationSound() {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Erro ao tocar som:', e));
  }

  public addEventListener(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public removeEventListener(event: string, callback: EventCallback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: unknown) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Entrar em sala de chat específica
  public joinChatRoom(chatLogId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ WebSocket não conectado - não é possível entrar na sala');
      return;
    }

    if (!chatLogId) {
      console.error('❌ chatLogId é obrigatório para entrar na sala');
      return;
    }

    // Sair da sala anterior se existir
    if (this.currentChatLogId && this.currentChatLogId !== chatLogId) {
      this.leaveChatRoom(this.currentChatLogId);
    }

    console.log(`🏠 Entrando na sala de chat: ${chatLogId}`);
    this.socket.emit('join-chat-room', { chatLogId } as JoinChatRoomPayload);
    this.currentChatLogId = chatLogId;
  }

  // Sair de sala de chat
  public leaveChatRoom(chatLogId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ WebSocket não conectado - não é possível sair da sala');
      return;
    }

    if (!chatLogId) {
      console.error('❌ chatLogId é obrigatório para sair da sala');
      return;
    }

    console.log(`🚪 Saindo da sala de chat: ${chatLogId}`);
    this.socket.emit('leave-chat-room', { chatLogId } as LeaveChatRoomPayload);
    
    if (this.currentChatLogId === chatLogId) {
      this.currentChatLogId = null;
    }
  }

  // Enviar mensagem via WebSocket
  public sendMessage(chatLogId: string, content: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket não conectado');
    }

    if (!chatLogId || !content.trim()) {
      throw new Error('chatLogId e content são obrigatórios');
    }

    const payload: SendMessagePayload = {
      chatLogId: chatLogId,
      content: content.trim()
    };

    console.log('📤 Enviando mensagem via WebSocket:', payload);
    this.socket.emit('send-message', payload);
  }

  // Métodos legados (manter para compatibilidade)
  public joinRoom(roomId: string) {
    console.warn('⚠️ joinRoom está deprecated, use joinChatRoom');
    this.joinChatRoom(roomId);
  }

  public leaveRoom(roomId: string) {
    console.warn('⚠️ leaveRoom está deprecated, use leaveChatRoom');
    this.leaveChatRoom(roomId);
  }

  // Desconectar WebSocket
  public disconnect() {
    if (this.socket) {
      // Sair da sala atual antes de desconectar
      if (this.currentChatLogId) {
        this.leaveChatRoom(this.currentChatLogId);
      }
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentChatLogId = null;
      console.log('🔌 WebSocket desconectado manualmente');
    }
  }

  // Reconectar WebSocket
  public reconnect() {
    console.log('🔄 Reconectando WebSocket...');
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Getters
  public get connected() {
    return this.isConnected && this.socket?.connected;
  }

  public get socketId() {
    return this.socket?.id;
  }

  public get currentRoom() {
    return this.currentChatLogId;
  }

  private setupVisibilityHandlers() {
    // Detectar mudanças de visibilidade da aba
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
      console.log(`👁️ Tab visibility changed: ${this.isTabVisible ? 'visible' : 'hidden'}`);
      
      if (this.isTabVisible) {
        // Aba voltou a ficar visível
        if (!this.isConnected && localStorage.getItem('ialogus:token')) {
          console.log('🔄 Tab ficou visível, reconectando...');
          this.connect();
        } else if (this.isConnected) {
          // Enviar ping para verificar se ainda está conectado
          this.sendPing();
        }
      }
    });
    
    // Detectar quando a janela ganha/perde foco
    window.addEventListener('focus', () => {
      console.log('🎯 Window ganhou foco');
      if (!this.isConnected && localStorage.getItem('ialogus:token')) {
        this.connect();
      }
    });
    
    window.addEventListener('blur', () => {
      console.log('😴 Window perdeu foco');
      // Não desconectar, apenas log
    });
    
    // Detectar quando o usuário está prestes a sair da página
    window.addEventListener('beforeunload', () => {
      console.log('🚪 Usuário saindo da página');
      this.disconnect();
    });
  }
  
  private startPingInterval() {
    this.stopPingInterval(); // Limpar interval anterior se existir
    
    // Enviar ping manual a cada 15 segundos
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.sendPing();
      }
    }, 15000);
  }
  
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  private sendPing() {
    if (this.socket && this.isConnected) {
      console.log('🏓 Enviando ping manual');
      this.socket.emit('ping');
      
      // Timeout para verificar pong
      const pongTimeout = setTimeout(() => {
        console.log('⚠️ Pong não recebido, conexão pode estar perdida');
        if (this.isTabVisible) {
          this.reconnect();
        }
      }, 5000);
      
      // Limpar timeout se pong for recebido
      this.socket.once('pong', () => {
        console.log('🏓 Pong recebido');
        clearTimeout(pongTimeout);
      });
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
    
    this.reconnectInterval = setTimeout(() => {
      if (!this.isConnected && this.isTabVisible) {
        console.log('⏰ Executando reconexão agendada');
        this.connect();
      }
    }, 2000);
  }
}

// Singleton instance
const webSocketService = new WebSocketService();
console.log('📦 Instância webSocketService criada:', webSocketService);

export { webSocketService };
 
 