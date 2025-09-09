import { ChatLogItem } from '@/services/chats';
import { NewMessageData, webSocketService } from '@/services/websocket';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface ConversationContextValue {
  conversations: ChatLogItem[];
  setConversations: React.Dispatch<React.SetStateAction<ChatLogItem[]>>;
  updateConversationFromNewMessage: (messageData: NewMessageData) => void;
  unreadConversations: Set<string>;
  unreadCounts: Map<string, number>;
  markConversationAsRead: (conversationId: string) => void;
  currentActiveConversationId: string | null;
  setCurrentActiveConversationId: (id: string | null) => void;
}

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

interface ConversationProviderProps {
  children: ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const [conversations, setConversations] = useState<ChatLogItem[]>([]);
  
  // Track processed message IDs to prevent duplicates
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());
  
  // Inicializar com dados do localStorage se existir
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('ialogus:unreadConversations');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(() => {
    try {
      const stored = localStorage.getItem('ialogus:unreadCounts');
      return stored ? new Map(JSON.parse(stored)) : new Map();
    } catch {
      return new Map();
    }
  });
  
  const [currentActiveConversationId, setCurrentActiveConversationId] = useState<string | null>(null);

  // Function to update conversation based on new message
  const updateConversationFromNewMessage = useCallback((messageData: NewMessageData) => {
    console.log('🌐 ConversationContext: Atualizando conversa com nova mensagem:', messageData);
    console.log('📋 Total de conversas antes da atualização:', conversations.length);
    
    // Check if this message has already been processed (prevent duplicates)
    if (messageData.id && processedMessageIds.has(messageData.id)) {
      console.log('🔍 Message already processed, skipping duplicate:', messageData.id);
      return;
    }
    
    // Add message ID to processed set
    if (messageData.id) {
      setProcessedMessageIds(prev => new Set([...prev, messageData.id]));
      console.log('✅ Message ID added to processed set:', messageData.id);
    }
    
    setConversations(prevConversations => {
      console.log('🔍 Procurando conversa com ID:', messageData.chatLogId);
      console.log('📋 Lista atual de IDs:', prevConversations.map(c => c.chatLogId));
      
      const conversationIndex = prevConversations.findIndex(conv => conv.chatLogId === messageData.chatLogId);
      
      if (conversationIndex === -1) {
        console.log('⚠️ ConversationContext: Conversa não encontrada na lista global');
        console.log('🆕 Criando nova entrada de conversa para:', messageData.chatLogId);
        
        // Create a new conversation entry if not found
        const newConversation: ChatLogItem = {
          chatLogId: messageData.chatLogId,
          contactId: messageData.contactId,
          contactName: messageData.customerName,
          contactPhoneNumber: messageData.customerPhone,
          channelName: messageData.channelName,
          lastMessage: {
            message: messageData.content,
            isFromCustomer: messageData.isFromCustomer,
            createdAt: messageData.createdAt,
            messageType: messageData.messageType || 'text',
            mediaFilename: messageData.mediaFilename || null,
            mediaOriginalFilename: messageData.mediaOriginalFilename || null,
            mediaMimeType: messageData.mediaMimeType || null,
            mediaFilePath: messageData.mediaUrl || null,
          },
          updatedAt: messageData.createdAt,
          createdAt: messageData.createdAt,
          hasMediaMessages: (messageData.messageType && messageData.messageType !== 'text') || false,
          currentLeadEngagement: messageData.leadTemperature || 1,
          isActive: true,
          isWaitingForResponse: false,
          canAiAnswer: true,
          hasActiveWhatsappServiceWindow: false,
          whatsappServiceWindowExpiresAt: null,
          lastChatLogMetrics: {
            totalMessages: 1,
            totalMessagesFromCustomer: messageData.isFromCustomer ? 1 : 0,
            totalMessagesFromSeller: messageData.isFromCustomer ? 0 : 1,
            interactionDuration: 0
          }
        };
        
        // Add new conversation to the top
        return [newConversation, ...prevConversations];
      }

      console.log('✅ ConversationContext: Conversa encontrada no índice:', conversationIndex);

      // Create updated conversation with proper lastMessage structure
      const updatedConversation: ChatLogItem = {
        ...prevConversations[conversationIndex],
        lastMessage: {
          message: messageData.content,
          isFromCustomer: messageData.isFromCustomer,
          createdAt: messageData.createdAt,
          messageType: messageData.messageType || 'text',
          mediaFilename: messageData.mediaFilename || null,
          mediaOriginalFilename: messageData.mediaOriginalFilename || null,
          mediaMimeType: messageData.mediaMimeType || null,
          mediaFilePath: messageData.mediaUrl || null,
        },
        updatedAt: messageData.createdAt,
        hasMediaMessages: prevConversations[conversationIndex].hasMediaMessages || (messageData.messageType && messageData.messageType !== 'text') || false,
        // Update customer info if available
        contactName: messageData.customerName || prevConversations[conversationIndex].contactName,
        // Update lead temperature if provided
        ...(messageData.leadTemperature && 
           messageData.leadTemperature >= 1 && 
           messageData.leadTemperature <= 5 && {
          currentLeadEngagement: messageData.leadTemperature
        })
      };

      const newConversations = [...prevConversations];
      
      // Remover a conversa da posição atual
      newConversations.splice(conversationIndex, 1);
      
      // Adicionar no topo
      newConversations.unshift(updatedConversation);
      
      console.log('📈 ConversationContext: Conversa movida para o topo após nova mensagem');

      console.log('✅ ConversationContext: Lista de conversas atualizada');
      return newConversations;
    });

    // Mark as unread and increment count if message is from customer
    // BUT only if it's not the currently active conversation
    console.log('🔔 Verificando se deve marcar como não lida:', {
      isFromCustomer: messageData.isFromCustomer,
      chatLogId: messageData.chatLogId,
      currentActiveConversationId,
      isNotCurrentConversation: messageData.chatLogId !== currentActiveConversationId
    });
    
    // Marcar como não lida se:
    // 1. Não é a conversa ativa atualmente
    // 2. É uma mensagem do cliente OU é uma mensagem do vendedor mas de outro dispositivo
    const shouldMarkAsUnread = messageData.chatLogId !== currentActiveConversationId;
    
    if (shouldMarkAsUnread) {
      console.log('✅ Marcando conversa como não lida:', {
        chatLogId: messageData.chatLogId,
        isFromCustomer: messageData.isFromCustomer,
        reason: messageData.isFromCustomer ? 'Mensagem do cliente' : 'Mensagem de outro dispositivo'
      });
      
      setUnreadConversations(prev => {
        const newSet = new Set([...prev, messageData.chatLogId]);
        console.log('📋 UnreadConversations atualizado:', Array.from(newSet));
        return newSet;
      });
      
      // Increment the unread count for this conversation
      setUnreadCounts(prev => {
        const newCounts = new Map(prev);
        const currentCount = newCounts.get(messageData.chatLogId) || 0;
        const newCount = currentCount + 1;
        newCounts.set(messageData.chatLogId, newCount);
        console.log('🔢 Contador de não lidas atualizado:', {
          chatLogId: messageData.chatLogId,
          previousCount: currentCount,
          newCount: newCount,
          allCounts: Array.from(newCounts.entries())
        });
        return newCounts;
      });
    } else {
      console.log('❌ Não marcando como não lida:', {
        reason: 'Conversa está ativa atualmente'
      });
    }
  }, [currentActiveConversationId, conversations.length, processedMessageIds]); // Add currentActiveConversationId and processedMessageIds as dependencies

  // Persistir unread data no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('ialogus:unreadConversations', JSON.stringify(Array.from(unreadConversations)));
  }, [unreadConversations]);
  
  useEffect(() => {
    localStorage.setItem('ialogus:unreadCounts', JSON.stringify(Array.from(unreadCounts)));
  }, [unreadCounts]);
  
  // Clean up old message IDs periodically (keep only last 1000)
  useEffect(() => {
    if (processedMessageIds.size > 1000) {
      const idsArray = Array.from(processedMessageIds);
      const recentIds = idsArray.slice(-500); // Keep last 500 IDs
      setProcessedMessageIds(new Set(recentIds));
      console.log('🧹 Cleaned up processed message IDs, kept last 500');
    }
  }, [processedMessageIds]);
  
  // Function to mark conversation as read
  const markConversationAsRead = useCallback((conversationId: string) => {
    console.log('📧 Marcando conversa como lida:', conversationId);
    
    setUnreadConversations(prev => {
      const newSet = new Set(prev);
      newSet.delete(conversationId);
      console.log('📋 UnreadConversations após marcar como lida:', Array.from(newSet));
      return newSet;
    });
    
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.delete(conversationId);
      console.log('🔢 UnreadCounts após marcar como lida:', Array.from(newCounts.entries()));
      return newCounts;
    });
  }, []);

  // Set up global WebSocket listener for new messages
  useEffect(() => {
    console.log('🎯 ConversationContext: Configurando listener de WebSocket');
    
    const handleNewMessage = (data: unknown) => {
      console.log('🌐 ConversationContext: Nova mensagem recebida via WebSocket (raw):', data);
      
      // Type guard to ensure data is NewMessageData
      if (data && typeof data === 'object' && 'chatLogId' in data && 'content' in data) {
        const messageData = data as NewMessageData;
        console.log('✅ ConversationContext: Dados validados, atualizando conversa');
        updateConversationFromNewMessage(messageData);
      } else {
        console.error('❌ ConversationContext: Dados inválidos recebidos:', data);
      }
    };

    // Add listener
    webSocketService.addEventListener('new-message', handleNewMessage);
    console.log('✅ ConversationContext: Listener adicionado');

    // Cleanup
    return () => {
      console.log('🧹 ConversationContext: Removendo listener');
      webSocketService.removeEventListener('new-message', handleNewMessage);
    };
  }, [updateConversationFromNewMessage]); // Add dependency to ensure latest function is used

  const contextValue: ConversationContextValue = {
    conversations,
    setConversations,
    updateConversationFromNewMessage,
    unreadConversations,
    unreadCounts,
    markConversationAsRead,
    currentActiveConversationId,
    setCurrentActiveConversationId,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
} 