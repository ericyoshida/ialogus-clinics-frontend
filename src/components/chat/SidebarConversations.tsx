import { useConversationContext } from '@/contexts/ConversationContext';
import { chatsService } from '@/services';
import { ChatLogItem, ChatLogsQueryParams, LastMessageObject } from '@/services/chats';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NewMessageData } from '../../services/websocket';
import { FilterIcon } from '../icons/FilterIcon';
import { NewChatIcon } from '../icons/NewChatIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ConversationStatus } from './AvatarWithStatus';
import { ConversationFilters } from './ConversationFilters';
import { ConversationItem, ConversationItemProps } from './ConversationItem';

type SidebarConversationsProps = {
  onSelectConversation: (chatLog: ChatLogItem) => void;
  selectedClinicId?: string;
  selectedConversationId?: string | null;
  newMessageUpdate?: NewMessageData | null;
  selectedChannelId?: string;
};

export function SidebarConversations({ 
  onSelectConversation,
  selectedClinicId,
  selectedConversationId,
  newMessageUpdate,
  selectedChannelId
}: SidebarConversationsProps) {
  // Manter referência do ID selecionado localmente para garantir persistência
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedConversationId || null);
  
  // AbortController for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Sincronizar com prop externa
  useEffect(() => {
    if (selectedConversationId !== undefined) {
      setLocalSelectedId(selectedConversationId);
    }
  }, [selectedConversationId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use conversation context for global state management
  const { 
    conversations, 
    setConversations, 
    unreadConversations, 
    unreadCounts, 
    markConversationAsRead 
  } = useConversationContext();
  
  // Force update trigger
  const [, forceUpdate] = useState(0);

  // Local state for pagination and filters
  const [pagination, setPagination] = useState({
    nextCursor: null as string | null,
    hasMore: true
  });
  
  const [filters, setFilters] = useState<ChatLogsQueryParams>({
    canAiAnswer: undefined,
    isWaitingForResponse: undefined,
    isActive: undefined,
    leadEngagements: undefined,
    lastInteractionDateAfter: undefined,
    agentId: undefined,
    query: undefined,
    channelId: undefined
  });

  // Handle new message updates from ConversationsPage (fallback)
  useEffect(() => {
    if (!newMessageUpdate) {
      console.log('📱 Sidebar: newMessageUpdate é null, ignorando');
      return;
    }

    console.log('📱 Sidebar: Recebeu newMessageUpdate local (fallback):', newMessageUpdate);
    // Force a re-render to ensure UI updates
    forceUpdate(prev => prev + 1);
  }, [newMessageUpdate]);
  
  // Log conversations changes
  useEffect(() => {
    console.log('📋 Sidebar: Lista de conversas atualizada:', {
      total: conversations.length,
      unreadCount: unreadConversations.size,
      firstConversation: conversations[0]?.patientName
    });
  }, [conversations, unreadConversations]);

  // Remove unread status when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      markConversationAsRead(selectedConversationId);
    }
  }, [selectedConversationId, markConversationAsRead]);

  // Update when selected channel changes
  useEffect(() => {
    if (selectedChannelId) {
      console.log('🔄 Canal selecionado mudou para:', selectedChannelId);
      
      // Clear conversations immediately to show loading state
      setConversations([]);
      setPagination({
        nextCursor: null,
        hasMore: true
      });
      
      // Update filters with new channel
      setFilters(prev => ({
        ...prev,
        channelId: selectedChannelId
      }));
    }
  }, [selectedChannelId]);

  // Process filters to remove placeholder values like "any" or "all"
  const processFilters = useCallback((filters: ChatLogsQueryParams): ChatLogsQueryParams => {
    const processed: Record<string, unknown> = {};
    
    // Copy only the filters that have valid values
    Object.entries(filters).forEach(([key, value]) => {
      // Skip default/placeholder values that shouldn't be sent to the API
      if (value === 'any' || value === 'all') {
        return;
      }
      
      // Handle arrays (like leadEngagements)
      if (Array.isArray(value) && value.length > 0) {
        processed[key] = value;
        return;
      }
      
      // Handle booleans
      if (typeof value === 'boolean') {
        processed[key] = value;
        return;
      }
      
      // Handle dates
      if (value instanceof Date) {
        processed[key] = value;
        return;
      }
      
      // Include all other non-empty string values
      if (value !== undefined && value !== null && value !== '') {
        processed[key] = value;
      }
    });
    
    return processed as ChatLogsQueryParams;
  }, []);

  const fetchChatLogs = useCallback(async (cursor?: string) => {
    if (!selectedClinicId) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    console.log('📡 Buscando conversas com filtros:', filters);
    
    try {
      setIsLoading(true);
      setLoadingError(null);
      
      // Process filters to remove placeholder values and format correctly
      const processedFilters = processFilters({...filters});
      
      const queryParams: ChatLogsQueryParams = {
        ...processedFilters,
        cursor: cursor || undefined
      };
      
      console.log('📡 Query params enviados:', queryParams);
      
      // Check if request was aborted before making the call
      if (abortController.signal.aborted) {
        console.log('⚠️ Requisição cancelada antes de começar');
        return;
      }
      
      const response = await chatsService.getChatLogs(selectedClinicId, queryParams);
      
      // Check if request was aborted after receiving response
      if (abortController.signal.aborted) {
        console.log('⚠️ Requisição cancelada após receber resposta');
        return;
      }
      
      console.log(`📊 Conversas recebidas: ${response.patientsChatLogItems.length}`);

      // If this is the first load or a filter change (no cursor), replace all data
      if (!cursor) {
        setConversations(response.patientsChatLogItems);
      } else {
        // If loading more, append to existing data
        setConversations(prev => [...prev, ...response.patientsChatLogItems]);
      }
      
      setPagination({
        nextCursor: response.pagination.nextCursor,
        hasMore: response.pagination.hasMore
      });
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError') {
        console.log('🛑 Requisição cancelada');
        return;
      }
      
      console.error('Error fetching chat logs:', error);
      setLoadingError('Erro ao carregar conversas. Tente novamente.');
    } finally {
      // Only set loading to false if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [selectedClinicId, filters, processFilters, setConversations]);

  // Load conversations when filters or clinic changes
  useEffect(() => {
    if (!selectedClinicId) return;
    
    fetchChatLogs();
  }, [selectedClinicId, filters, fetchChatLogs]);

  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedClinicId) {
        // Only update the search filter if we have a clinic ID
        setFilters(prev => ({
          ...prev,
          query: searchQuery || undefined
        }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, selectedClinicId]);

  // Handle infinite scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

      if (isNearBottom && pagination.hasMore && !isLoading && !isLoadingMore) {
        console.log('📜 Chegou ao fim do scroll, carregando mais conversas...');
        handleLoadMore();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [pagination.hasMore, isLoading, isLoadingMore]);



  const handleSelectConversation = (id: string) => {
    console.log('🔍 SidebarConversations: Selecionando conversa:', id);
    const conversation = conversations.find(log => log.chatLogId === id);
    if (conversation) {
      setLocalSelectedId(id); // Manter seleção local
      onSelectConversation(conversation);
    } else {
      console.error('❌ Conversa não encontrada:', id);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore && pagination.nextCursor && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchChatLogs(pagination.nextCursor).finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [pagination.hasMore, pagination.nextCursor, isLoadingMore, fetchChatLogs]);

  const handleApplyFilters = (newFilters: ChatLogsQueryParams) => {
    setFilters(newFilters);
  };

  // Helper function to detect specific media type from message preview
  const detectMediaTypeFromMessagePreview = (messagePreview: string): string | null => {
    if (!messagePreview) return null;
    
    // Be more flexible - detect common media indicators
    
    // Audio patterns - more flexible patterns
    const audioPatterns = [
      /🎵|🎶|🎤|♪|♫/,                          // Audio emojis
      /\.(mp3|wav|m4a|ogg|flac|aac|opus)$/i,   // Audio file extensions at end
      /mensagem de áudio|áudio|voice|audio/i,  // Audio message terms
      /🎵.*?(enviando|gravando|áudio)/i,        // Audio being sent/recorded
      /PTT-\d+|ptt/i,                          // WhatsApp audio message pattern
      /voice message|voice note|mensagem de voz|nota de voz/i, // Voice message
      /gravou um áudio|sent an audio/i,        // Audio sent phrases
    ];
    
    // Image patterns - more flexible patterns
    const imagePatterns = [
      /📷|📸|🖼️|🌄|🎨/,                        // Camera/picture emojis
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|heic)$/i, // Image file extensions at end
      /imagem|image|foto|photo|picture/i,      // Image related terms
      /screenshot|captura|print/i,             // Screenshot terms
      /enviou uma foto|sent a photo|enviou uma imagem|sent an image/i, // Image sent phrases
    ];
    
    // Video patterns - more flexible patterns
    const videoPatterns = [
      /📹|🎬|🎥|🎞️/,                           // Video emojis
      /\.(mp4|mov|avi|mkv|webm|m4v|3gp|wmv)$/i, // Video file extensions at end
      /vídeo|video/i,                          // Video terms
      /enviou um vídeo|sent a video/i,         // Video sent phrases
    ];
    
    // Document patterns - more flexible patterns
    const documentPatterns = [
      /📄|📋|📝|📁|📊|📈|📉/,                  // Document emojis
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf)$/i, // Document file extensions at end
      /documento|document|arquivo|file/i,      // Document terms
      /enviou um arquivo|sent a file|enviou um documento|sent a document/i, // File sent phrases
    ];
    
    // Generic attachment patterns (catch-all)
    const attachmentPatterns = [
      /📎|💾|📋/,                              // Attachment emojis
      /anexo|attachment|attached/i,            // Attachment terms
      /enviou|sent.*?(file|arquivo|attachment|anexo)/i, // Generic sent file
    ];
    
    // Check in order of specificity
    if (audioPatterns.some(pattern => pattern.test(messagePreview))) {
      return 'audio';
    }
    
    if (imagePatterns.some(pattern => pattern.test(messagePreview))) {
      return 'image';
    }
    
    if (videoPatterns.some(pattern => pattern.test(messagePreview))) {
      return 'video';
    }
    
    if (documentPatterns.some(pattern => pattern.test(messagePreview))) {
      return 'document';
    }
    
    if (attachmentPatterns.some(pattern => pattern.test(messagePreview))) {
      return 'attachment';
    }
    
    return null;
  };

  // Helper function to extract filename from message preview
  const extractFilenameFromPreview = (messagePreview: string): string | null => {
    if (!messagePreview) return null;
    
    // Try to extract filename after emoji or keywords
    const filenamePatterns = [
      /(?:📄|📋|📝|📁|📊|📈|📉|📎)\s*(.+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf))/i,
      /(?:arquivo|file|document|documento).*?:\s*(.+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf))/i,
      /(.+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf))\s*$/i, // Filename at the end
    ];
    
    for (const pattern of filenamePatterns) {
      const match = messagePreview.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  };

  // Map the API response items to the ConversationItem format
  const mapChatLogToConversationItem = (chatLog: ChatLogItem): ConversationItemProps => {
    // Handle lastMessage - it might be an object or a string
    let messagePreview = '';
    let mediaType: string | null = null;
    let extractedFilename: string | null = null;
    let hasCaption = false; // Track if media has caption
    
    if (typeof chatLog.lastMessage === 'string') {
      messagePreview = chatLog.lastMessage;
      // Detect media type from preview content
      mediaType = detectMediaTypeFromMessagePreview(messagePreview);
      // Extract filename if it's a document
      extractedFilename = extractFilenameFromPreview(messagePreview);
      // Check if there's actual text content beyond media indicators
      hasCaption = messagePreview.length > 0 && !messagePreview.match(/^(🎵|📷|📹|📄|📎)/);
    } else if (chatLog.lastMessage && typeof chatLog.lastMessage === 'object') {
      const lastMessageObj = chatLog.lastMessage as LastMessageObject;
      messagePreview = lastMessageObj.message || '';
      
      // Check if the last message is a media message (priority 1)
      if (lastMessageObj.messageType && lastMessageObj.messageType !== 'text') {
        mediaType = lastMessageObj.messageType;
        
        // Use actual filename if available
        if (lastMessageObj.mediaOriginalFilename) {
          extractedFilename = lastMessageObj.mediaOriginalFilename;
        } else if (lastMessageObj.mediaFilename) {
          extractedFilename = lastMessageObj.mediaFilename;
        }
        
        // Check if there's a caption (text content) with the media
        hasCaption = messagePreview && 
                   messagePreview.trim().length > 0 && 
                   !messagePreview.includes('Imagem enviada') &&
                   !messagePreview.includes('Image sent') &&
                   !messagePreview.includes('Mensagem de áudio') &&
                   !messagePreview.includes('Audio message') &&
                   !messagePreview.includes('Documento enviado') &&
                   !messagePreview.includes('Document sent');
      } else {
        // Fallback: detect from preview content (priority 2)
        mediaType = detectMediaTypeFromMessagePreview(messagePreview);
        extractedFilename = extractFilenameFromPreview(messagePreview);
        hasCaption = messagePreview.length > 0 && !messagePreview.match(/^(🎵|📷|📹|📄|📎)/);
      }
    }

    // Check if the conversation has media messages from the API response (priority 3)
    if (!mediaType && chatLog.hasMediaMessages) {
      mediaType = 'unknown'; // We know there's media but don't know the type
    }

    // If we have media but no preview text, provide fallback text with proper names
    if (mediaType && !messagePreview.trim()) {
      hasCaption = false; // No caption if we're using fallback text
      switch (mediaType) {
        case 'audio':
          messagePreview = 'Audio';
          break;
        case 'image':
          messagePreview = 'Foto';
          break;
        case 'video':
          messagePreview = 'Vídeo';
          break;
        case 'document':
          if (extractedFilename) {
            messagePreview = extractedFilename;
          } else {
            messagePreview = 'Documento';
          }
          break;
        case 'attachment':
          if (extractedFilename) {
            messagePreview = extractedFilename;
          } else {
            messagePreview = 'Arquivo';
          }
          break;
        default:
          messagePreview = 'Mídia';
      }
    }

    // If we have a filename, prefer showing it over generic text for documents
    if (mediaType === 'document' && extractedFilename && !messagePreview.includes(extractedFilename)) {
      messagePreview = extractedFilename;
      hasCaption = false; // Document names are not captions
    }

    // Override generic text with specific format for audio and images
    if (mediaType === 'audio' && (messagePreview.includes('Mensagem de áudio') || messagePreview.includes('áudio'))) {
      messagePreview = 'Audio';
      hasCaption = false; // Generic audio message, no caption
    }
    if (mediaType === 'image' && (messagePreview.includes('Imagem enviada') || messagePreview.includes('imagem'))) {
      messagePreview = 'Foto';
      hasCaption = false; // Generic image message, no caption
    }

    // Remove emoji icons from message preview when we have mediaType to avoid duplication
    if (mediaType) {
      messagePreview = messagePreview
        .replace(/^(🎵|🎶|🎤|♪|♫)\s*/, '') // Remove audio emojis at start
        .replace(/^(📷|📸|🖼️|🌄|🎨)\s*/, '') // Remove image emojis at start
        .replace(/^(📹|🎬|🎥|🎞️)\s*/, '') // Remove video emojis at start
        .replace(/^(📄|📋|📝|📁|📊|📈|📉)\s*/, '') // Remove document emojis at start
        .replace(/^(📎|💾|📋)\s*/, '') // Remove attachment emojis at start
        .trim();
      
      // If after removing emojis we have no text, use fallback
      if (!messagePreview) {
        switch (mediaType) {
          case 'audio':
            messagePreview = 'Audio';
            break;
          case 'image':
            messagePreview = 'Foto';
            break;
          case 'video':
            messagePreview = 'Vídeo';
            break;
          case 'document':
            messagePreview = extractedFilename || 'Documento';
            break;
          case 'attachment':
            messagePreview = extractedFilename || 'Arquivo';
            break;
          default:
            messagePreview = 'Mídia';
        }
      }
    }

    // For images, if we have original content and it doesn't look like generic text, preserve it
    // This ensures image previews are maintained
    if (mediaType === 'image' && typeof chatLog.lastMessage === 'object') {
      const lastMessageObj = chatLog.lastMessage as LastMessageObject;
      const originalContent = lastMessageObj.message || '';
      
      // If the original content doesn't look like generic placeholder text, preserve it
      if (originalContent && 
          !originalContent.includes('Imagem enviada') && 
          !originalContent.includes('Image sent') &&
          !originalContent.includes('📷') &&
          originalContent.length > 5) {
        messagePreview = originalContent; // Preserve original caption/content for image preview
        hasCaption = true; // This is a real caption
      }
    }

    // Get the actual unread count for this conversation
    const unreadCount = unreadCounts.get(chatLog.chatLogId) || 0;

    return {
      id: chatLog.chatLogId,
      contactName: chatLog.patientName,
      clinicName: '', // This field isn't in the API response
      lastMessageDate: new Date(chatLog.updatedAt),
      messagePreview,
      unreadCount: unreadCount, // Use the actual count from the Map
      channel: mapChannelName(chatLog.channelName),
      channelPhoneNumber: undefined,
      leadTemperature: undefined, // This field is not provided by the backend
      conversationStatus: getConversationStatus(chatLog),
      selected: chatLog.chatLogId === (localSelectedId || selectedConversationId),
      mediaType: mediaType, // Always show media icon when there's media
      onClick: handleSelectConversation
    };
  };

  // Helper function to map channel names to our component's expected format
  const mapChannelName = (channelName: string): 'whatsapp' | 'instagram' | 'sms' | 'email' => {
    if (channelName === 'whatsapp' || channelName === 'instagram') {
      return channelName;
    }
    if (channelName === 'facebook-messager') {
      return 'instagram'; // Using instagram icon for Facebook Messenger
    }
    if (channelName === 'telegram') {
      return 'sms'; // Using SMS icon for Telegram
    }
    return 'sms'; // Default fallback
  };

  // Helper function to determine conversation status
  const getConversationStatus = (chatLog: ChatLogItem): ConversationStatus => {
    if (chatLog.isWaitingForResponse) return 'waiting';
    if (!chatLog.isActive) return 'inactive';
    // For now, use client as default active state
    return 'client';
  };

  const conversationItems = conversations.map(mapChatLogToConversationItem);
  
  // Log para debug
  useEffect(() => {
    console.log('📋 SidebarConversations: selectedConversationId =', selectedConversationId);
    console.log('📋 SidebarConversations: total conversations =', conversations.length);
    const selectedItem = conversationItems.find(item => item.id === selectedConversationId);
    console.log('📋 SidebarConversations: selected item found =', !!selectedItem);
  }, [selectedConversationId, conversationItems]);

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      {/* Fixed header section */}
      <div className="h-14 px-4 py-2 flex items-center border-b flex-shrink-0">
        <div className="relative w-full min-w-0">
          <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar conversas..."
            className="pl-8 pr-12 py-1 h-8 text-sm w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-2 flex items-center space-x-1">
            <button 
              className="p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
              onClick={() => setIsFilterDialogOpen(true)}
            >
              <FilterIcon className="h-4 w-4" />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-100 flex-shrink-0">
              <NewChatIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Scrollable conversation list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={scrollContainerRef}>
        {isLoading && conversationItems.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : loadingError ? (
          <div className="p-4 text-center text-red-500">
            {loadingError}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => fetchChatLogs()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : conversationItems.length > 0 ? (
          <div className="flex flex-col w-full">
            {conversationItems.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                {...conversation}
              />
            ))}
            
            {pagination.hasMore && (
              <div className="p-2 flex justify-center">
                {isLoadingMore ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span className="text-sm text-gray-500">Carregando mais conversas...</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLoadMore} 
                    disabled={isLoading}
                  >
                    Carregar mais
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            Nenhuma conversa encontrada
          </div>
        )}
      </div>

      {/* Filters dialog */}
      <ConversationFilters
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
} 