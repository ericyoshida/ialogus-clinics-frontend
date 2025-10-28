import { ChannelTabs } from '@/components/chat/ChannelTabs'
import { ChatSection } from '@/components/chat/ChatSection'
import { ContactDetailsModal } from '@/components/chat/ContactDetailsModal'
import { ContactDetailsSidebar } from '@/components/chat/ContactDetailsSidebar'
import { EmptyChatPlaceholder } from '@/components/chat/EmptyChatPlaceholder'
import { SidebarConversations } from '@/components/chat/SidebarConversations'
import { useToast } from '@/components/ui/use-toast'
import { useClinic } from '@/contexts/ClinicContext'
import { useConversationContext } from '@/contexts/ConversationContext'
import { useWhatsappChannels } from '@/hooks/use-whatsapp-channels'
import { ConversationItem, Message } from '@/mock/conversations'
import { chatsService, webSocketService } from '@/services'
import { ChatLogItem, ChatLogMetrics, ChatMessage, LastMessageObject, MediaMessageResponse } from '@/services/chats'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { WhatsappServiceWindowData } from '../../services/websocket'

// Type for controlling mobile view
type MobileView = 'conversations' | 'chat' | 'details';

// Extended ChatMessage interface that includes media fields
interface ExtendedChatMessage extends ChatMessage {
  messageType?: 'text' | 'image' | 'document' | 'audio';
  mediaFilename?: string;
  mediaOriginalFilename?: string;
  mediaMimeType?: string;
  mediaUrl?: string;
}

// Extended conversation item that includes chat log metrics
interface ExtendedConversationItem extends ConversationItem {
  chatLogMetrics?: ChatLogMetrics;
  currentLeadEngagement?: number;
  hasActiveWhatsappServiceWindow: boolean;
  whatsappServiceWindowExpiresAt: string | null;
}

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<ExtendedConversationItem | null>(null);
  const [currentChatLogId, setCurrentChatLogId] = useState<string>('');
  const [isUpdatingFromWebSocket, setIsUpdatingFromWebSocket] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<MobileView>('conversations');
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const [messagesTake, setMessagesTake] = useState<number>(0);
  const [isLoadingPreviousMessages, setIsLoadingPreviousMessages] = useState<boolean>(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [tempMessageIds, setTempMessageIds] = useState<Set<string>>(new Set());
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  // Get clinicId from URL params
  const { clinicId } = useParams<{ clinicId: string }>();
  
  const { selectedClinic } = useClinic();
  const { toast } = useToast();
  
  // Use conversation context for managing global conversation state
  const { setCurrentActiveConversationId, markConversationAsRead, conversations, unreadCounts } = useConversationContext();

  // Get clinic data from context
  const { isLoading: isClinicLoading, error: clinicError } = useClinic();
  
  // Use clinicId from URL as primary source, fallback to context
  const selectedClinicId = clinicId || selectedClinic?.id || '';
  
  // Fetch WhatsApp channels
  const { channels, isLoading: isLoadingChannels } = useWhatsappChannels(selectedClinicId);
  
  // Set first channel as selected when channels load
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Efeito para manter a conversa selecionada sincronizada
  useEffect(() => {
    if (currentChatLogId && !isUpdatingFromWebSocket) {
      console.log('🔄 Mantendo conversa selecionada após atualização:', currentChatLogId);
    }
  }, [currentChatLogId, isUpdatingFromWebSocket]);

  // Sync messages from conversation context to selected conversation
  useEffect(() => {
    if (selectedConversation && currentChatLogId) {
      // This effect is now simplified since ConversationContext handles deduplication
      // We only need to trigger a re-render when conversations update
      console.log('📨 Conversation context updated for chat:', currentChatLogId);
    }
  }, [conversations, currentChatLogId]);
  
  // Configure WebSocket Event Handlers
  useEffect(() => {
    // Conectar o WebSocket se ainda não estiver conectado e houver token
    const token = localStorage.getItem('ialogus:token');
    if (token && !webSocketService.connected) {
      console.log('🔌 Conectando WebSocket...');
      webSocketService.connect();
    }
    
    const handleConnect = () => {
      console.log('🔗 WebSocket conectado');
      setIsWebSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('🔌 WebSocket desconectado');
      setIsWebSocketConnected(false);
    };

    const handleConnectionEstablished = (data: unknown) => {
      console.log('✅ Conexão WebSocket estabelecida:', data);
      setIsWebSocketConnected(true);
    };

    const handleMessageSent = (data: unknown) => {
      console.log('📤 Mensagem enviada via WebSocket:', data);
    };

    // Handler for new messages - now handled by ConversationContext
    // Removed duplicate listener to prevent duplicate messages

    const handleWebSocketError = (error: unknown) => {
      console.error('❌ Erro no WebSocket:', error);
      // Aqui você pode adicionar uma notificação toast
    };

    const handleAuthenticationError = (error: unknown) => {
      console.error('🔐 Erro de autenticação WebSocket:', error);
      // Aqui você pode adicionar uma notificação toast
    };

    const handleChatNotFound = (error: unknown) => {
      console.error('💬 Chat não encontrado:', error);
      // Aqui você pode adicionar uma notificação toast
    };

    const handleWhatsappServiceWindowStatus = (data: WhatsappServiceWindowData) => {
      console.log('📱 Status da janela de serviço WhatsApp:', data);
      
      // Update the current conversation's service window status if it matches
      if (selectedConversation && data.customerId === selectedConversation.id) {
        setSelectedConversation(prev => prev ? {
            ...prev,
            hasActiveWhatsappServiceWindow: data.hasActiveWhatsappServiceWindow,
          whatsappServiceWindowExpiresAt: data.whatsappServiceWindowExpiresAt
        } : null);
      }

        // Aqui você pode adicionar uma notificação toast
    };

    // Registrar event listeners
    webSocketService.addEventListener('connect', handleConnect);
    webSocketService.addEventListener('disconnect', handleDisconnect);
    webSocketService.addEventListener('connection-established', handleConnectionEstablished);
    webSocketService.addEventListener('message-sent', handleMessageSent);
    // Removed 'new-message' listener - now handled by ConversationContext
    webSocketService.addEventListener('error', handleWebSocketError);
    webSocketService.addEventListener('authentication-error', handleAuthenticationError);
    webSocketService.addEventListener('chat-not-found', handleChatNotFound);
    webSocketService.addEventListener('whatsapp-service-window-status', handleWhatsappServiceWindowStatus);

    // Verificar status inicial da conexão
    setIsWebSocketConnected(webSocketService.connected);

    // Cleanup function
    return () => {
      webSocketService.removeEventListener('connect', handleConnect);
      webSocketService.removeEventListener('disconnect', handleDisconnect);
      webSocketService.removeEventListener('connection-established', handleConnectionEstablished);
      webSocketService.removeEventListener('message-sent', handleMessageSent);
      // Removed 'new-message' listener cleanup
      webSocketService.removeEventListener('error', handleWebSocketError);
      webSocketService.removeEventListener('authentication-error', handleAuthenticationError);
      webSocketService.removeEventListener('chat-not-found', handleChatNotFound);
      webSocketService.removeEventListener('whatsapp-service-window-status', handleWhatsappServiceWindowStatus);
    };
  }, [selectedConversation]); // Add selectedConversation as dependency

  // Join/leave WebSocket rooms when conversation changes
  useEffect(() => {
    if (currentChatLogId && isWebSocketConnected) {
      // Join the new room
      webSocketService.joinRoom(currentChatLogId);
      
      return () => {
        // Leave the room when conversation changes or component unmounts
        webSocketService.leaveRoom(currentChatLogId);
      };
    }
  }, [currentChatLogId, isWebSocketConnected]);

  // Detect screen size safely for SSR
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.matchMedia('(min-width: 1170px)').matches);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add listener for size changes
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLoadPreviousMessages = async (): Promise<void> => {
    if (!selectedClinicId || !currentChatLogId || isLoadingPreviousMessages || !hasMoreMessages) {
      return;
    }

    try {
      setIsLoadingPreviousMessages(true);
      
      // Start with take=1 for the first previous messages request
      const newTake = messagesTake + 1;
      
      // Load messages with take parameter (starting from 1)
      const messagesResponse = await chatsService.getChatMessages(
        selectedClinicId, 
        currentChatLogId,
        { take: newTake }
      );
      
      // Use hasOlderChatLog to determine if there are more messages
      setHasMoreMessages(messagesResponse.hasOlderChatLog);
      
      // Convert API messages to the expected format
      const messages: Message[] = messagesResponse.messages.map((apiMessage: ChatMessage) => {
        const extendedMessage = apiMessage as ExtendedChatMessage;
        return {
          id: extendedMessage.id,
          text: extendedMessage.content,
          timestamp: new Date(extendedMessage.createdAt),
          isOutgoing: !extendedMessage.isFromCustomer,
          // Add media information if available
          ...(extendedMessage.messageType && {
            mediaType: extendedMessage.messageType,
            mediaFilename: extendedMessage.mediaFilename,
            mediaOriginalFilename: extendedMessage.mediaOriginalFilename,
            mediaMimeType: extendedMessage.mediaMimeType,
            mediaUrl: extendedMessage.mediaUrl
          })
        };
      });

      // Get current messages from the conversation
      const currentMessages = selectedConversation?.messages || [];
      
      // Find new messages (messages that are not already in the current list)
      const currentMessageIds = new Set(currentMessages.map(msg => msg.id));
      const newMessages = messages.filter(msg => !currentMessageIds.has(msg.id));
      
      // Sort new messages by timestamp (oldest first) and prepend them
      const sortedNewMessages = newMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const updatedMessages = [...sortedNewMessages, ...currentMessages];

      // Calculate updated metrics based on ALL loaded messages (combined)
      const messagesFromSeller = updatedMessages.filter(msg => msg.isOutgoing).length;
      const messagesFromCustomer = updatedMessages.filter(msg => !msg.isOutgoing).length;
      
      // Calculate interaction duration from first to last message
      let interactionDuration = 0;
      if (updatedMessages.length > 1) {
        const sortedMessages = [...updatedMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const firstMessage = sortedMessages[0];
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        interactionDuration = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
      }

      // Update conversation with the combined messages (new ones above existing ones)
      setSelectedConversation(prev => prev ? { 
        ...prev, 
        messages: updatedMessages,
        chatLogMetrics: {
          totalMessages: updatedMessages.length,
          totalMessagesFromSeller: messagesFromSeller,
          totalMessagesFromCustomer: messagesFromCustomer,
          interactionDuration: interactionDuration
        }
      } : null);
      setMessagesTake(newTake);
      
    } catch (error) {
      console.error("Error loading previous messages:", error);
    } finally {
      setIsLoadingPreviousMessages(false);
    }
  };

  const handleSelectConversation = async (chatLog: ChatLogItem) => {
    try {
      setIsLoadingMessages(true);
      setCurrentChatLogId(chatLog.chatLogId);
      
      // Set this conversation as active in the global context
      setCurrentActiveConversationId(chatLog.chatLogId);
      
      // Mark conversation as read
      markConversationAsRead(chatLog.chatLogId);
      
      // Reset messages pagination when selecting a new conversation
      setMessagesTake(0);
      setHasMoreMessages(true);
      
      // Handle lastMessage - it might be an object or a string
      let lastMessageText = '';
      if (typeof chatLog.lastMessage === 'string') {
        lastMessageText = chatLog.lastMessage;
      } else if (chatLog.lastMessage && typeof chatLog.lastMessage === 'object') {
        lastMessageText = (chatLog.lastMessage as LastMessageObject).message || '';
      }

      const conversation: ExtendedConversationItem = {
        id: chatLog.chatLogId,
        avatarUrl: `https://i.pravatar.cc/150?u=${chatLog.patientId}`,
        contactName: chatLog.patientName,
        clinicName: '',
        lastMessageAt: new Date(chatLog.updatedAt),
        unreadCount: 0,
        channel: mapChannelNameToType(chatLog.channelName),
        statusColors: ['#C4C4C4', '#C4C4C4', '#C4C4C4'], // Default colors as lead engagement is not available
        selected: true,
        lastMessage: lastMessageText,
        phoneNumber: chatLog.patientPhoneNumber,
        isAgentActive: chatLog.canAiAnswer,
        messages: [],
        tags: [],
        chatLogMetrics: chatLog.lastChatLogMetrics || {
          totalMessages: 0,
          totalMessagesFromCustomer: 0,
          totalMessagesFromSeller: 0,
          interactionDuration: 0
        },
        currentLeadEngagement: undefined, // Lead engagement is not provided by backend
        // WhatsApp service window properties from API
        hasActiveWhatsappServiceWindow: chatLog.hasActiveWhatsappServiceWindow || false,
        whatsappServiceWindowExpiresAt: chatLog.whatsappServiceWindowExpiresAt || null,
      };
      
      setSelectedConversation(conversation);
      setMobileView('chat');

      // Load initial messages WITHOUT take parameter
      const messagesResponse = await chatsService.getChatMessages(
        selectedClinicId, 
        chatLog.chatLogId
        // No queryParams - this loads the default/most recent messages
      );
      
      // Convert API messages to the expected format
      const messages: Message[] = messagesResponse.messages.map((apiMessage: ChatMessage) => {
        const extendedMessage = apiMessage as ExtendedChatMessage;
        return {
          id: extendedMessage.id,
          text: extendedMessage.content,
          timestamp: new Date(extendedMessage.createdAt),
          isOutgoing: !extendedMessage.isFromCustomer,
          // Add media information if available
          ...(extendedMessage.messageType && {
            mediaType: extendedMessage.messageType,
            mediaFilename: extendedMessage.mediaFilename,
            mediaOriginalFilename: extendedMessage.mediaOriginalFilename,
            mediaMimeType: extendedMessage.mediaMimeType,
            mediaUrl: extendedMessage.mediaUrl
          })
        };
      });

      // Calculate updated metrics based on loaded messages
      const messagesFromSeller = messages.filter(msg => msg.isOutgoing).length;
      const messagesFromCustomer = messages.filter(msg => !msg.isOutgoing).length;
      
      // Calculate interaction duration from first to last message
      let interactionDuration = 0;
      if (messages.length > 1) {
        const sortedMessages = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const firstMessage = sortedMessages[0];
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        interactionDuration = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
      }

      // Update conversation with loaded messages and calculated metrics
      setSelectedConversation(prev => prev ? { 
        ...prev, 
        messages,
        chatLogMetrics: {
          totalMessages: messages.length,
          totalMessagesFromSeller: messagesFromSeller,
          totalMessagesFromCustomer: messagesFromCustomer,
          interactionDuration: interactionDuration
        }
      } : null);
      // Keep messagesTake at 0 - it will be incremented when user scrolls for previous messages
      
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Helper function to map channel name to expected type
  const mapChannelNameToType = (channelName: string) => {
    if (channelName === 'whatsapp' || channelName === 'instagram') {
      return channelName;
    }
    if (channelName === 'facebook-messager') {
      return 'instagram' as const; // Use Instagram for Facebook
    }
    return 'sms' as const; // Default fallback
  };

  // Helper function to map lead engagement level to status colors
  const mapLeadEngagementToColors = (level: number): string[] => {
    switch (level) {
      case 1:
        return ['#C4C4C4', '#C4C4C4', '#C4C4C4'];
      case 2:
        return ['#FFAA00', '#C4C4C4', '#C4C4C4'];
      case 3:
        return ['#FFAA00', '#FFAA00', '#C4C4C4'];
      case 4:
        return ['#00B212', '#FFAA00', '#C4C4C4'];
      case 5:
        return ['#00B212', '#00B212', '#00B212'];
      default:
        return ['#C4C4C4', '#C4C4C4', '#C4C4C4'];
    }
  };

  const handleSendMessage = (text: string) => {
    if (!selectedConversation || !currentChatLogId) return;

    try {
      // Gerar ID único para a mensagem temporária
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Criar mensagem temporária para UI (optimistic update)
      const tempMessage: Message = {
        id: tempId,
      text,
      timestamp: new Date(),
      isOutgoing: true,
    };

      // Adicionar ID temporário ao set de rastreamento
      setTempMessageIds(prev => new Set([...prev, tempId]));

      // Atualizar UI imediatamente
      setSelectedConversation(prev => {
        if (!prev) return null;
        
        const updatedMessages = [...(prev.messages || []), tempMessage];
        
        // Recalcular métricas com a nova mensagem temporária
        const messagesFromSeller = updatedMessages.filter(msg => msg.isOutgoing).length;
        const messagesFromCustomer = updatedMessages.filter(msg => !msg.isOutgoing).length;
        
        // Calculate interaction duration from first to last message
        let interactionDuration = 0;
        if (updatedMessages.length > 1) {
          const sortedMessages = [...updatedMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          const firstMessage = sortedMessages[0];
          const lastMessage = sortedMessages[sortedMessages.length - 1];
          interactionDuration = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
        }
        
        // Atualizar métricas do chat log
        const updatedMetrics = {
          ...prev.chatLogMetrics,
          totalMessagesFromSeller: messagesFromSeller,
          totalMessagesFromCustomer: messagesFromCustomer,
          interactionDuration: interactionDuration
        };
        
          return {
          ...prev,
          messages: updatedMessages,
            lastMessageAt: new Date(),
            lastMessage: text,
          chatLogMetrics: updatedMetrics
        };
      });

      // Enviar mensagem via API
      chatsService.sendTextMessage(currentChatLogId, text)
        .then((response) => {
          console.log('✅ Mensagem enviada via API:', response);
          
          // Remove the temporary message and add the real one
          setSelectedConversation(prev => {
            if (!prev) return null;
            
            // Filter out the temporary message
            const filteredMessages = prev.messages.filter(msg => msg.id !== tempId);
            
            // Create the real message from API response
            const realMessage: Message = {
              id: response.message.id,
              text: response.message.content,
              timestamp: new Date(response.message.createdAt),
              isOutgoing: !response.message.isFromCustomer,
            };
            
            // Add the real message
            const updatedMessages = [...filteredMessages, realMessage];
            
            // Recalculate metrics
            const messagesFromSeller = updatedMessages.filter(msg => msg.isOutgoing).length;
            const messagesFromCustomer = updatedMessages.filter(msg => !msg.isOutgoing).length;
            
            let interactionDuration = 0;
            if (updatedMessages.length > 1) {
              const sortedMessages = [...updatedMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              const firstMessage = sortedMessages[0];
              const lastMessage = sortedMessages[sortedMessages.length - 1];
              interactionDuration = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
            }
            
            const updatedMetrics = {
              ...prev.chatLogMetrics,
              totalMessagesFromSeller: messagesFromSeller,
              totalMessagesFromCustomer: messagesFromCustomer,
              interactionDuration: interactionDuration
            };
            
            return {
              ...prev,
              messages: updatedMessages,
              lastMessageAt: new Date(response.message.createdAt),
              lastMessage: response.message.content,
              chatLogMetrics: updatedMetrics
            };
          });
          
          // Remove from temporary IDs set
          setTempMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempId);
            return newSet;
          });
        })
        .catch((error) => {
          console.error('❌ Erro ao enviar mensagem via API:', error);
          
          // Remove temporary message on error
          setSelectedConversation(prev => {
            if (!prev) return null;
            const filteredMessages = prev.messages.filter(msg => msg.id !== tempId);
            
            // Recalcular métricas após remover a mensagem temporária
            const messagesFromSeller = filteredMessages.filter(msg => msg.isOutgoing).length;
            const messagesFromCustomer = filteredMessages.filter(msg => !msg.isOutgoing).length;
            
            let interactionDuration = 0;
            if (filteredMessages.length > 1) {
              const sortedMessages = [...filteredMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              const firstMessage = sortedMessages[0];
              const lastMessage = sortedMessages[sortedMessages.length - 1];
              interactionDuration = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
            }
            
            const updatedMetrics = {
              ...prev.chatLogMetrics,
              totalMessagesFromSeller: messagesFromSeller,
              totalMessagesFromCustomer: messagesFromCustomer,
              interactionDuration: interactionDuration
            };
            
            return {
              ...prev,
              messages: filteredMessages,
              chatLogMetrics: updatedMetrics
            };
          });
          
          setTempMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempId);
            return newSet;
          });
          
          // Show error to user (you could add a toast notification here)
          alert('Erro ao enviar mensagem. Tente novamente.');
        });

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      // Aqui você pode mostrar uma notificação de erro para o usuário
      // e remover a mensagem temporária da UI se necessário
    }
  };

  // Função para lidar com o envio de áudio
  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('🎵 Processando envio de áudio:', {
      size: audioBlob.size,
      type: audioBlob.type,
      duration,
      timestamp: Date.now()
    });

    // 🔍 VALIDAÇÃO: Verificar duração mínima
    if (duration < 0.5) { // Menos de 0.5 segundos
      console.warn('⚠️ Áudio muito curto, ignorando envio:', { duration });
      alert('Áudio muito curto. Grave pelo menos 1 segundo.');
      return;
    }

    // 🔍 VALIDAÇÃO: Verificar tamanho mínimo do arquivo
    if (audioBlob.size < 1000) { // Menos de 1KB
      console.warn('⚠️ Arquivo de áudio muito pequeno:', { 
        size: audioBlob.size, 
        duration,
        type: audioBlob.type 
      });
      alert('Arquivo de áudio inválido. Tente gravar novamente.');
      return;
    }

    if (!selectedConversation) {
      console.error('❌ Nenhuma conversa selecionada');
      return;
    }

    const currentChatLogId = selectedConversation.id;
    const tempId = Math.random().toString(36).substr(2, 9);

    // Criar mensagem temporária para UI otimista
    const tempMessage: Message = {
      id: tempId,
      text: '🎵 Enviando áudio...',
      timestamp: new Date(),
      isOutgoing: true,
      mediaType: 'audio',
      mediaFilename: `recording-${Date.now()}.ogg`,
      mediaOriginalFilename: `recording-${Date.now()}.${audioBlob.type.includes('mp4') ? 'm4a' : 'ogg'}`,
      mediaMimeType: audioBlob.type
    };

    // Atualizar UI com mensagem temporária
    setSelectedConversation(prev => {
      if (!prev) return null;
      
      const updatedMessages = [...prev.messages, tempMessage];
      
      // Recalcular métricas
      const sellerMessages = updatedMessages.filter(msg => msg.isOutgoing).length;
      const customerMessages = updatedMessages.filter(msg => !msg.isOutgoing).length;
      
      const timestamps = updatedMessages.map(msg => new Date(msg.timestamp).getTime());
      const interactionDuration = timestamps.length > 1 
        ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000)
        : 0;
      
      return {
        ...prev,
        messages: updatedMessages,
        sellerMessages,
        customerMessages,
        interactionDuration
      };
    });

    try {
      console.log('📤 Enviando áudio para API:', {
        chatLogId: currentChatLogId,
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        duration,
        filename: tempMessage.mediaFilename
      });

      // Enviar áudio original sem conversão - backend fará a otimização
      const response = await chatsService.sendAudioMessage(
        currentChatLogId, 
        audioBlob, 
        tempMessage.mediaOriginalFilename
      );

      console.log('✅ Áudio enviado com sucesso:', response);

      // Atualizar mensagem temporária com dados reais
      setSelectedConversation(prev => {
        if (!prev) return null;
        
        const updatedMessages = prev.messages.map(msg => 
          msg.id === tempId 
            ? { 
                id: response.message.id,
                text: response.message.content || '🎵 Áudio',
                timestamp: new Date(response.message.createdAt),
                isOutgoing: !response.message.isFromCustomer,
                mediaType: response.message.messageType,
                mediaFilename: response.message.mediaFilename,
                mediaOriginalFilename: response.message.mediaOriginalFilename,
                mediaMimeType: response.message.mediaMimeType,
                mediaUrl: response.mediaUrl
              } 
            : msg
        );

        // Recalcular métricas com dados reais
        const sellerMessages = updatedMessages.filter(msg => msg.isOutgoing).length;
        const customerMessages = updatedMessages.filter(msg => !msg.isOutgoing).length;
        
        const timestamps = updatedMessages.map(msg => new Date(msg.timestamp).getTime());
        const interactionDuration = timestamps.length > 1 
          ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000)
          : 0;
        
        return {
          ...prev,
          messages: updatedMessages,
          sellerMessages,
          customerMessages,
          interactionDuration
        };
      });

    } catch (error) {
      console.error('❌ Erro ao enviar áudio:', error);
      
      // Remover mensagem temporária em caso de erro
      setSelectedConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempId)
        };
      });
      
      alert('Erro ao enviar áudio. Tente novamente.');
    }
  };

  // Função para lidar com o envio de arquivos
  const handleSendFile = async (file: File, caption?: string) => {
    console.log('📎 Arquivo recebido:', { 
      name: file.name, 
      size: file.size, 
      type: file.type, 
      caption 
    });
    
    if (!selectedConversation) {
      console.error('Nenhuma conversa selecionada');
      return;
    }

    const currentChatLogId = selectedConversation.id;
    
    // Validar arquivo
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }
    
    // Gerar ID temporário único para o arquivo
    const tempId = `temp-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determinar tipo de mídia e emoji
    const { mediaType, emoji } = getMediaTypeAndEmoji(file.type);
    
    // Criar URL temporária para preview de imagens
    let tempMediaUrl: string | undefined;
    if (mediaType === 'image') {
      tempMediaUrl = URL.createObjectURL(file);
    }
    
    // Criar mensagem temporária para atualização otimista da UI
    const tempMessage: Message = {
      id: tempId,
      text: (() => {
        // Para imagens, não mostrar texto - apenas a imagem
        if (mediaType === 'image') {
          return caption || ''; // Só mostrar caption se fornecida
        }
        // Para outros tipos, mostrar emoji + nome do arquivo
        return caption || `${emoji} ${file.name}`;
      })(),
      timestamp: new Date(),
      isOutgoing: true,
      mediaType: mediaType as 'text' | 'image' | 'document' | 'audio',
      mediaFilename: file.name,
      mediaOriginalFilename: file.name,
      mediaMimeType: file.type,
      mediaUrl: tempMediaUrl // URL temporária para preview
    };
    
    // Atualizar a UI imediatamente
    setSelectedConversation(prev => {
      if (!prev) return null;
      
      const updatedMessages = [...prev.messages, tempMessage];
      
      // Calcular métricas atualizadas
      const sellerMessages = updatedMessages.filter(msg => msg.isOutgoing).length;
      const customerMessages = updatedMessages.filter(msg => !msg.isOutgoing).length;
      
      // Calcular duração da interação
      const timestamps = updatedMessages.map(msg => new Date(msg.timestamp).getTime());
      const interactionDuration = timestamps.length > 1 
        ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000)
        : 0;
      
          return {
        ...prev,
        messages: updatedMessages,
        lastMessage: tempMessage.text,
        lastMessageTime: tempMessage.timestamp.toISOString(),
        sellerMessages,
        customerMessages,
        interactionDuration
      };
    });

    try {
      // Determinar qual função de envio usar baseada no tipo de arquivo
      let response: MediaMessageResponse;
      
      if (mediaType === 'image') {
        response = await chatsService.sendImageMessage(currentChatLogId, file, caption);
      } else if (mediaType === 'video') {
        response = await chatsService.sendVideoMessage(currentChatLogId, file, caption);
      } else if (mediaType === 'audio') {
        response = await chatsService.sendAudioMessage(currentChatLogId, file, file.name);
      } else if (mediaType === 'document') {
        response = await chatsService.sendDocumentMessage(currentChatLogId, file, caption);
      } else {
        // Fallback para outros tipos
        response = await chatsService.sendFileMessage(currentChatLogId, file, caption);
      }
      
      console.log('✅ Arquivo enviado com sucesso:', response);
      
      // Atualizar a mensagem temporária com a resposta real da API
      setSelectedConversation(prev => {
        if (!prev) return null;
        
        const updatedMessages = prev.messages.map(msg => 
          msg.id === tempId 
            ? { 
                id: response.message.id,
                text: response.message.content || tempMessage.text,
                timestamp: new Date(response.message.createdAt),
                isOutgoing: !response.message.isFromCustomer,
                mediaType: response.message.messageType,
                mediaFilename: response.message.mediaFilename,
                mediaOriginalFilename: response.message.mediaOriginalFilename,
                mediaMimeType: response.message.mediaMimeType,
                mediaUrl: response.mediaUrl
              } 
            : msg
        );
        
        // Limpar URL temporária se foi criada
        if (tempMediaUrl) {
          URL.revokeObjectURL(tempMediaUrl);
        }
        
        // Recalcular métricas com dados reais
        const sellerMessages = updatedMessages.filter(msg => msg.isOutgoing).length;
        const customerMessages = updatedMessages.filter(msg => !msg.isOutgoing).length;
        
        const timestamps = updatedMessages.map(msg => new Date(msg.timestamp).getTime());
        const interactionDuration = timestamps.length > 1 
          ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000)
          : 0;
        
        return {
          ...prev,
          messages: updatedMessages,
          lastMessage: response.message.content || tempMessage.text,
          lastMessageTime: response.message.createdAt,
          sellerMessages,
          customerMessages,
          interactionDuration
        };
      });
      
    } catch (error) {
      console.error('❌ Erro ao enviar arquivo:', error);
      
      // Limpar URL temporária se foi criada
      if (tempMediaUrl) {
        URL.revokeObjectURL(tempMediaUrl);
      }
      
      // Remover mensagem temporária em caso de erro
      setSelectedConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempId)
        };
      });
      
      // Exibir alerta de erro específico
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao enviar arquivo: ${errorMessage}`);
    }
  };

  // Função helper para validar arquivo
  const validateFile = (file: File): string | null => {
    // Definir limites específicos por tipo de mídia (conforme guia de requisitos)
    const limits = {
      image: 5 * 1024 * 1024,     // 5MB para imagens
      audio: 16 * 1024 * 1024,    // 16MB para áudio
      video: 16 * 1024 * 1024,    // 16MB para vídeo
      document: 100 * 1024 * 1024 // 100MB para documentos
    };

    // Tipos aceitos conforme especificações dos testes funcionais
    const allowedTypes = {
      // Imagens (até 5MB)
      image: [
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'
      ],
      // Áudio (até 16MB) - em ordem de prioridade conforme guia
      audio: [
        'audio/ogg',      // OGG/OPUS - Formato recomendado pelo WhatsApp
        'audio/mpeg',     // MP3 - Será convertido automaticamente
        'audio/mp3',      // MP3 alternativo
        'audio/wav',      // WAV - Será convertido automaticamente
        'audio/mp4',      // M4A/AAC - Será convertido automaticamente
        'audio/aac',      // AAC
        'audio/webm'      // WebM
      ],
      // Vídeo (até 16MB)
      video: [
        'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/3gpp'
      ],
      // Documentos (até 100MB)
      document: [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 
        'text/csv'
      ]
    };

    // Determinar categoria do arquivo
    let category: 'image' | 'audio' | 'video' | 'document' | null = null;
    let maxSize = 0;

    if (allowedTypes.image.includes(file.type)) {
      category = 'image';
      maxSize = limits.image;
    } else if (allowedTypes.audio.includes(file.type)) {
      category = 'audio';
      maxSize = limits.audio;
    } else if (allowedTypes.video.includes(file.type)) {
      category = 'video';
      maxSize = limits.video;
    } else if (allowedTypes.document.includes(file.type)) {
      category = 'document';
      maxSize = limits.document;
    }

    // Verificar se tipo é suportado
    if (!category) {
      return 'Tipo de arquivo não suportado. Envie imagens (PNG, JPG, GIF, WebP), áudio (MP3, OGG, WAV, M4A, AAC), vídeo (MP4, MOV, AVI, WebM, 3GP) ou documentos (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV).';
    }

    // Verificar tamanho mínimo (conforme especificações)
    const minSize = category === 'audio' ? 1024 : 100; // 1KB para áudio, 100 bytes para outros
    if (file.size < minSize) {
      return `Arquivo muito pequeno. Mínimo para ${category}: ${formatFileSize(minSize)}`;
    }

    // Verificar tamanho máximo
    if (file.size > maxSize) {
      return `Arquivo de ${category} muito grande. Máximo permitido: ${formatFileSize(maxSize)}`;
    }

    return null;
  };

  // Função helper para formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função helper para determinar tipo de mídia e emoji
  const getMediaTypeAndEmoji = (fileType: string): { mediaType: string; emoji: string } => {
    if (fileType.startsWith('image/')) {
      return { mediaType: 'image', emoji: '🖼️' };
    } else if (fileType.startsWith('video/')) {
      return { mediaType: 'video', emoji: '🎬' };
    } else if (fileType.startsWith('audio/')) {
      return { mediaType: 'audio', emoji: '🎵' };
    } else if (fileType.includes('pdf')) {
      return { mediaType: 'document', emoji: '📄' };
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return { mediaType: 'document', emoji: '📝' };
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return { mediaType: 'document', emoji: '📊' };
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return { mediaType: 'document', emoji: '📈' };
    } else {
      return { mediaType: 'document', emoji: '📎' };
    }
  };

  const handleToggleAgentStatus = async () => {
    if (!selectedConversation || !currentChatLogId || isTogglingAI) return;
    
    try {
      setIsTogglingAI(true);
      
      // Determine which endpoint to call based on current AI status
      if (selectedConversation.isAgentActive) {
        // AI is currently active, so lock it
        await chatsService.lockAiToAnswerMessages(currentChatLogId);
        console.log('🤖 AI bloqueado para responder mensagens');
      } else {
        // AI is currently inactive, so release it
        await chatsService.releaseAiToAnswerMessages(currentChatLogId);
        console.log('🤖 AI liberado para responder mensagens');
      }
      
      // Update the selected conversation with the toggled agent status
      setSelectedConversation(prev => {
      if (!prev) return null;
        
      return {
        ...prev,
        isAgentActive: !prev.isAgentActive,
      };
    });
      
    } catch (error) {
      console.error('Erro ao alterar status do agente:', error);
      // You could add a toast notification here to show the error to the user
    } finally {
      setIsTogglingAI(false);
    }
  };

  // Function to open/close the details modal
  const toggleDetailsModal = () => {
    setIsDetailsModalOpen(prev => !prev);
  };

  const handleDownload = async (mediaUrl: string, filename: string, messageId?: string) => {
    console.log('📥 Iniciando download:', { mediaUrl: mediaUrl?.substring(0, 50) + '...', filename, messageId });
    
    try {
      // 1. Prioridade: API de download para mensagens reais com ID válido
      if (messageId && !messageId.startsWith('temp-')) {
        try {
          console.log('📡 Tentando download via API com message ID:', messageId);
          await chatsService.downloadMessageMedia(messageId);
          console.log('✅ Download concluído via API');
          return;
        } catch (apiError: unknown) {
          const errorMessage = (apiError as Error)?.message || 'Erro desconhecido';
          console.error('❌ Falha no download via API:', errorMessage);
          
          // Se for erro CORS ou 502, continue para outros métodos
          if (errorMessage.includes('CORS') || errorMessage.includes('502') || errorMessage.includes('Network Error')) {
            console.log('🔄 Erro de conectividade na API, tentando URL direta...');
          } else {
            // Para outros tipos de erro, mostrar alerta e parar
            alert(`Erro no download: ${errorMessage}`);
            return;
          }
        }
      }
      
      // 2. Fallback: URL direta se for HTTP(S)
      if (mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'))) {
        try {
          console.log('🌐 Tentando download direto via URL HTTP(S)');
          
          const response = await fetch(mediaUrl, {
            method: 'GET',
            mode: 'cors',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.style.display = 'none';
          
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          URL.revokeObjectURL(url);
          console.log('✅ Download concluído via URL direta');
          return;
        } catch (httpError: unknown) {
          const errorMessage = (httpError as Error)?.message || 'Erro desconhecido';
          console.error('❌ Falha no download via URL direta:', errorMessage);
          
          // Continue para blob URL se disponível
        }
      }
      
      // 3. Último recurso: blob URL (se API e URL direta falharam)
      if (mediaUrl && mediaUrl.startsWith('blob:')) {
        try {
          console.log('💾 Usando blob URL como último recurso');
          
          const a = document.createElement('a');
          a.href = mediaUrl;
          a.download = filename;
          a.style.display = 'none';
          
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          console.log('✅ Download concluído via blob URL');
          return;
        } catch (blobError: unknown) {
          const errorMessage = (blobError as Error)?.message || 'Erro desconhecido';
          console.error('❌ Falha no download via blob URL:', errorMessage);
          alert('Erro: blob URL pode ter expirado. Tente novamente.');
          return;
        }
      }
      
      // Se chegou aqui, nenhum método funcionou
      alert('Não foi possível baixar o arquivo. Tente novamente mais tarde.');
      
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || 'Erro desconhecido';
      console.error('❌ Erro geral no download:', errorMessage);
      alert(`Erro no download: ${errorMessage}`);
    }
  };

  // If we're still loading clinics, show a loading state
  if (isClinicLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  // If we have an error, show the error message
  if (clinicError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md p-6">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Erro</h3>
          <p className="text-gray-600 mt-2">{clinicError}</p>
        </div>
      </div>
    );
  }

  // If no clinic is selected, show a message
  if (!selectedClinicId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md p-6">
          <div className="mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Selecione uma clínica</h3>
          <p className="text-gray-600 mt-2">Por favor, selecione uma clínica na barra lateral para visualizar as conversas.</p>
        </div>
      </div>
    );
  }

  // Component for mobile header with navigation - ONLY FOR CONVERSATIONS AND DETAILS
  const MobileHeader = () => {
    if (mobileView === 'conversations') {
      return (
        <div className="h-14 bg-white flex items-center border-b">
          <h2 className="text-lg font-semibold px-4">Conversas</h2>
          {/* WebSocket status indicator */}
          <div className="ml-auto mr-4 flex items-center">
            <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="ml-1 text-xs text-gray-500">
              {isWebSocketConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      );
    } else if (mobileView === 'details') {
      return (
        <div className="h-14 bg-white flex items-center border-b">
          <button 
            onClick={() => setMobileView('chat')}
            className="p-1 ml-2 mr-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">Detalhes do Contato</h2>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="flex flex-col h-full w-full m-0">
      {/* Page Title - Same for mobile and desktop */}
      <div className="-mt-2 pt-0 mb-1 mx-0">
        <h1 className="text-[21px] font-medium text-gray-900 px-4">
          Chat e Conversas
        </h1>
      </div>
      
      {/* Channel Tabs - Above everything */}
      {channels.length > 0 && selectedChannelId && (
        <ChannelTabs
          channels={channels}
          conversations={conversations}
          selectedChannelId={selectedChannelId}
          onSelectChannel={setSelectedChannelId}
          unreadCounts={unreadCounts}
        />
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 m-0 mx-0 p-0 pb-1 lg:px-4 lg:mx-0 flex flex-col md:grid md:grid-cols-[250px_1fr] xl:grid-cols-[250px_1fr_250px] gap-0 md:gap-2 xl:gap-4 overflow-hidden">
        {/* Mobile Layout (Only for screens below md) */}
        <div className="flex flex-col h-full w-full md:hidden m-0 mx-0 overflow-hidden">
          {/* Mobile Header with navigation - ONLY for conversations and details */}
          {mobileView !== 'chat' && <MobileHeader />}
          
          {/* Content based on current view */}
          {mobileView === 'conversations' && (
            <div className="flex-1 overflow-hidden w-full m-0">
              <SidebarConversations
                onSelectConversation={handleSelectConversation}
                selectedClinicId={selectedClinicId}
                selectedConversationId={currentChatLogId}
                selectedChannelId={selectedChannelId}
              />
            </div>
          )}
          
          {mobileView === 'chat' && (
            <div className="flex-1 overflow-hidden w-full m-0">
              <ChatSection
                selectedConversation={selectedConversation}
                onSendMessage={handleSendMessage}
                onSendAudio={handleSendAudio}
                onSendFile={handleSendFile}
                onDownload={handleDownload}
                showMobileNav={true}
                showDetailsButton={true}
                onBackClick={() => setMobileView('conversations')}
                onDetailsClick={() => setMobileView('details')}
                onToggleAgentStatus={handleToggleAgentStatus}
                isLoadingMessages={isLoadingMessages}
                onLoadPreviousMessages={handleLoadPreviousMessages}
                isLoadingPreviousMessages={isLoadingPreviousMessages}
                hasMoreMessages={hasMoreMessages}
              />
            </div>
          )}
          
          {mobileView === 'details' && (
            <div className="flex-1 overflow-hidden w-full m-0 bg-white">
              <ContactDetailsSidebar
                conversation={selectedConversation}
                onToggleAgentStatus={handleToggleAgentStatus}
                isTogglingAI={isTogglingAI}
              />
            </div>
          )}
        </div>

        {/* Conversations List (Visible from md up) */}
        <div className="hidden md:block h-full overflow-hidden rounded-md shadow-sm bg-white w-[250px] min-w-[250px] max-w-[250px]">
          <SidebarConversations
            onSelectConversation={handleSelectConversation}
            selectedClinicId={selectedClinicId}
            selectedConversationId={currentChatLogId}
            selectedChannelId={selectedChannelId}
          />
        </div>

        {/* Central Area - Chat or Placeholder */}
        {selectedConversation ? (
          <>
            {/* Chat Area (when a conversation is selected) */}
            <div className="hidden md:block h-full rounded-md overflow-hidden min-w-0">
              <div className="h-full bg-[#f0f2f5] shadow-sm overflow-hidden">
                <ChatSection
                  selectedConversation={selectedConversation}
                  onSendMessage={handleSendMessage}
                  onSendAudio={handleSendAudio}
                  onSendFile={handleSendFile}
                  onDownload={handleDownload}
                  showMobileNav={false}
                  showDetailsButton={!isLargeScreen}
                  onDetailsClick={toggleDetailsModal}
                  onToggleAgentStatus={handleToggleAgentStatus}
                  isLoadingMessages={isLoadingMessages}
                  onLoadPreviousMessages={handleLoadPreviousMessages}
                  isLoadingPreviousMessages={isLoadingPreviousMessages}
                  hasMoreMessages={hasMoreMessages}
                />
              </div>
            </div>

            {/* Contact Details Sidebar (only visible on xl screens) */}
            <div className="hidden xl:block h-full overflow-hidden rounded-md shadow-sm bg-white w-[250px] min-w-[250px] max-w-[250px]">
                <ContactDetailsSidebar
                  conversation={selectedConversation}
                  onToggleAgentStatus={handleToggleAgentStatus}
                isTogglingAI={isTogglingAI}
                />
              </div>
            
            {/* Contact Details Modal (for medium to large screens, not XL) */}
            {!isLargeScreen && (
              <ContactDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={toggleDetailsModal}
                conversation={selectedConversation}
                onToggleAgentStatus={handleToggleAgentStatus}
                isTogglingAI={isTogglingAI}
              />
            )}
          </>
        ) : (
          // Empty state placeholder when no conversation is selected
          <div className="hidden md:block col-span-1 xl:col-span-2 h-full rounded-md overflow-hidden">
            <EmptyChatPlaceholder />
          </div>
        )}
      </div>
    </div>
  );
} 