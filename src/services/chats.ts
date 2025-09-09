import { api } from '.';

// Interface for the query parameters
export interface ChatLogsQueryParams {
  botModelId?: string;
  query?: string;
  take?: string;
  cursor?: string;
  canAiAnswer?: boolean;
  isWaitingForResponse?: boolean;
  isActive?: boolean;
  leadEngagements?: number[];
  lastInteractionDateAfter?: Date;
  channelId?: string;
}

// Interface for chat messages query parameters
export interface ChatMessagesQueryParams {
  take?: number;
}

// Interface for the last message object
export interface LastMessageObject {
  message: string;
  isFromCustomer: boolean;
  createdAt: string;
  messageType?: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaFilename?: string | null;
  mediaOriginalFilename?: string | null;
  mediaMimeType?: string | null;
  mediaFilePath?: string | null;
}

// Interface for chat log metrics
export interface ChatLogMetrics {
  totalMessages: number;
  totalMessagesFromCustomer: number;
  totalMessagesFromSeller: number;
  interactionDuration: number;
}

// Interface for a chat message
export interface ChatMessage {
  id: string;
  isFromCustomer: boolean;
  content: string;
  chatLogId: string;
  createdAt: string;
  updatedAt: string;
  messageType?: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaFilename?: string;
  mediaOriginalFilename?: string;
  mediaMimeType?: string;
}

// Interface for each chat log item
export interface ChatLogItem {
  chatLogId: string;
  contactId: string;
  contactName: string;
  contactPhoneNumber: string;
  lastMessage: string | LastMessageObject;
  isActive: boolean;
  isWaitingForResponse: boolean;
  canAiAnswer: boolean;
  currentLeadEngagement: number;
  channelName: 'whatsapp' | 'instagram' | 'facebook-messager' | 'telegram';
  channelId: string;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
  lastChatLogMetrics: ChatLogMetrics;
  hasMediaMessages?: boolean;
  // WhatsApp service window properties
  hasActiveWhatsappServiceWindow?: boolean;
  whatsappServiceWindowStartedAt?: string | null;
  whatsappServiceWindowExpiresAt?: string | null;
}

// Interface for the pagination info
export interface PaginationInfo {
  take: number;
  nextCursor?: string;
  hasMore: boolean;
}

// Interface for the response from the backend
export interface ChatLogsResponse {
  contactsChatLogItems: ChatLogItem[];
  pagination: PaginationInfo;
}

// Interface for the messages response
export interface ChatMessagesResponse {
  messages: ChatMessage[];
  hasOlderChatLog: boolean;
}

// Interface for media message response
export interface MediaMessageResponse {
  message: {
    id: string;
    content: string;
    isFromCustomer: boolean;
    messageType: 'text' | 'image' | 'document' | 'audio';
    mediaFilename?: string;
    mediaOriginalFilename?: string;
    mediaMimeType?: string;
    createdAt: string;
    chatLogId: string;
  };
  mediaUrl?: string;
  success: boolean;
}

/**
 * Fetches chat logs for a specific seller company
 */
export const getChatLogs = async (
  clinicId: string,
  queryParams?: ChatLogsQueryParams
): Promise<ChatLogsResponse> => {
  try {
    console.log(`Fetching chat logs for company ID ${clinicId}...`);
    console.log('Query params recebidos:', queryParams);
    
    // Build URL with query parameters
    const params = new URLSearchParams();
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const url = `/seller-companies/${clinicId}/chat-logs${queryString ? `?${queryString}` : ''}`;
    
    console.log('URL final:', url);
    const response = await api.get<ChatLogsResponse>(url);
    
    console.log('Chat logs received:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching chat logs for company ID ${clinicId}:`, error);
    throw error;
  }
};

/**
 * Fetches messages for a specific chat log
 */
export const getChatMessages = async (
  clinicId: string,
  chatLogId: string,
  queryParams?: ChatMessagesQueryParams
): Promise<ChatMessagesResponse> => {
  try {
    console.log(`Fetching messages for chat log ID ${chatLogId}...`);
    
    // Build URL with query parameters
    const params = new URLSearchParams();
    
    if (queryParams?.take) {
      params.append('take', queryParams.take.toString());
    }
    
    const queryString = params.toString();
    const url = `/chat-logs/${chatLogId}/messages${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<ChatMessagesResponse>(url);
    console.log('Chat messages received:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching messages for chat log ID ${chatLogId}:`, error);
    throw error;
  }
};

/**
 * Releases AI to answer messages for a specific chat log
 */
export const releaseAiToAnswerMessages = async (chatLogId: string): Promise<void> => {
  try {
    console.log(`Releasing AI to answer messages for chat log ID ${chatLogId}...`);
    
    const url = `/chat-logs/${chatLogId}/release-ai-to-answer-messages`;
    
    await api.put(url);
    console.log('AI released to answer messages successfully');
  } catch (error) {
    console.error(`Error releasing AI to answer messages for chat log ID ${chatLogId}:`, error);
    throw error;
  }
};

/**
 * Locks AI from answering messages for a specific chat log
 */
export const lockAiToAnswerMessages = async (chatLogId: string): Promise<void> => {
  try {
    console.log(`Locking AI from answering messages for chat log ID ${chatLogId}...`);
    
    const url = `/chat-logs/${chatLogId}/lock-ai-to-answer-messages`;
    
    await api.put(url);
    console.log('AI locked from answering messages successfully');
  } catch (error) {
    console.error(`Error locking AI from answering messages for chat log ID ${chatLogId}:`, error);
    throw error;
  }
};

/**
 * Sends a text message to a chat log
 */
export const sendTextMessage = async (
  chatLogId: string,
  messageContent: string
): Promise<MediaMessageResponse> => {
  try {
    console.log(`Sending text message to chat log ID ${chatLogId}...`);
    
    const formData = new FormData();
    formData.append('messageContent', messageContent);
    
    const response = await api.post<MediaMessageResponse>(
      `/chat-logs/${chatLogId}/human-messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Text message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending text message to chat log ID ${chatLogId}:`, error);
    throw error;
  }
};

/**
 * Sends an image to a chat log
 */
export const sendImageMessage = async (
  chatLogId: string,
  imageFile: File,
  caption?: string
): Promise<MediaMessageResponse> => {
  try {
    console.log(`Sending image to chat log ID ${chatLogId}...`, {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      caption
    });
    
    const formData = new FormData();
    formData.append('file', imageFile);
    
    if (caption) {
      formData.append('messageContent', caption);
    }
    
    const response = await api.post<MediaMessageResponse>(
      `/chat-logs/${chatLogId}/human-messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Image sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending image to chat log ID ${chatLogId}:`, error);
    throw error;
  }
};

/**
 * Sends a document to a chat log
 */
export const sendDocumentMessage = async (
  chatLogId: string,
  documentFile: File,
  caption?: string
): Promise<MediaMessageResponse> => {
  try {
    console.log(`Sending document to chat log ID ${chatLogId}...`, {
      fileName: documentFile.name,
      fileSize: documentFile.size,
      fileType: documentFile.type,
      caption
    });
    
    const formData = new FormData();
    formData.append('file', documentFile);
    
    if (caption) {
      formData.append('messageContent', caption);
    }
    
    const response = await api.post<MediaMessageResponse>(
      `/chat-logs/${chatLogId}/human-messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Document sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending document to chat log ID ${chatLogId}:`, error);
    throw error;
  }
};

/**
 * Sends an audio file to a chat log
 */
export const sendAudioMessage = async (
  chatLogId: string,
  audioFile: File | Blob,
  fileName?: string
): Promise<MediaMessageResponse> => {
  try {
    console.log(`🎵 Enviando áudio para chat log ID ${chatLogId}...`, {
      fileName: fileName || 'recording.ogg',
      fileSize: audioFile.size,
      fileType: audioFile.type
    });
    
    // 🔍 DEBUG: Log detalhado do arquivo de áudio
    console.log('🔍 AUDIO DEBUG - Arquivo recebido:', {
      isFile: audioFile instanceof File,
      isBlob: audioFile instanceof Blob,
      size: audioFile.size,
      type: audioFile.type,
      fileName: fileName
    });
    
    const formData = new FormData();
    
    // Determinar extensão baseada no tipo MIME
    let extension = 'ogg'; // Default para OGG (preferido pelo WhatsApp)
    const mimeType = audioFile.type || 'audio/ogg';
    
    if (mimeType.includes('ogg')) {
      extension = 'ogg';
    } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
      extension = 'mp3';
    } else if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
      extension = 'm4a';
    } else if (mimeType.includes('aac')) {
      extension = 'aac';
    } else if (mimeType.includes('wav')) {
      extension = 'wav';
    } else if (mimeType.includes('webm')) {
      // WebM será convertido no backend para OGG
      console.log('🔄 WebM detectado - será convertido no backend para OGG');
      extension = 'webm'; // Manter extensão original para identificação no backend
    }
    
    // Criar nome do arquivo com extensão apropriada
    const timestamp = Date.now();
    const finalFileName = fileName || `recording-${timestamp}.${extension}`;
    
    console.log('🎵 Enviando áudio:', {
      originalType: audioFile.type,
      finalMimeType: mimeType,
      finalFileName,
      extension,
      size: audioFile.size
    });
    
    // Convert Blob to File if necessary
    let file: File;
    if (audioFile instanceof File) {
      file = audioFile;
    } else {
      // Manter tipo MIME original - deixar backend processar se necessário
      file = new File([audioFile], finalFileName, { 
        type: mimeType
      });
    }
    
    // 🔍 DEBUG: Verificar se o arquivo tem conteúdo válido
    if (file.size < 1000) { // Menos de 1KB é suspeito para áudio
      console.warn('⚠️ AUDIO DEBUG - Arquivo muito pequeno:', {
        size: file.size,
        name: file.name,
        type: file.type
      });
      throw new Error('Arquivo de áudio muito pequeno. Tente gravar novamente.');
    }
    
    console.log('📤 Arquivo final para envio:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    formData.append('file', file);
    
    const response = await api.post<MediaMessageResponse>(
      `/chat-logs/${chatLogId}/human-messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('✅ Áudio enviado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Erro ao enviar áudio para chat log ID ${chatLogId}:`, error);
    throw error;
  }
};

/**
 * Helper function to determine the appropriate send function based on file type
 */
export const sendFileMessage = async (
  chatLogId: string,
  file: File,
  caption?: string
): Promise<MediaMessageResponse> => {
  const fileType = file.type;
  
  if (fileType.startsWith('image/')) {
    return sendImageMessage(chatLogId, file, caption);
  } else if (fileType.startsWith('audio/')) {
    return sendAudioMessage(chatLogId, file, file.name);
  } else {
    // Treat everything else as document
    return sendDocumentMessage(chatLogId, file, caption);
  }
};

/**
 * Downloads media from a message
 */
export const downloadMessageMedia = async (messageId: string): Promise<void> => {
  try {
    console.log(`📥 Baixando mídia da mensagem ${messageId}...`);
    
    const response = await api.get(`/messages/${messageId}/download`, {
      responseType: 'blob',
    });
    
    console.log('📋 Resposta do servidor:', {
      contentType: response.headers['content-type'],
      contentDisposition: response.headers['content-disposition'],
      dataSize: response.data.size,
      dataType: response.data.type
    });
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    console.log('📋 Content-Disposition header:', contentDisposition);
    
    let filename = 'download'; // Default fallback
    
    if (contentDisposition) {
      // Try multiple patterns to extract filename
      // Pattern 1: filename*=UTF-8''filename.ext (RFC 5987 encoding) - try this first for better unicode support
      let match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
      if (match) {
        filename = decodeURIComponent(match[1]);
      } else {
        // Pattern 2: filename="filename.ext" (with quotes) - handle escaped quotes properly
        match = contentDisposition.match(/filename="((?:[^"\\]|\\.)*)"/);
        if (match) {
          // Unescape escaped quotes and other escaped characters
          filename = match[1].replace(/\\(.)/g, '$1');
        } else {
          // Pattern 3: filename=filename.ext (without quotes)
          match = contentDisposition.match(/filename=([^;]+)/);
          if (match) {
            filename = match[1].trim();
          }
        }
      }
    }
    
    console.log('📁 Extracted filename:', filename);

    // Get Content-Type from response headers (sent by backend)
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // Create blob with correct MIME type from backend
    const blob = new Blob([response.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    console.log('📁 Criando download:', {
      filename,
      contentType,
      blobType: blob.type,
      blobSize: blob.size
    });
    
    // Create temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log('✅ Download concluído:', filename);
  } catch (error) {
    console.error(`❌ Erro ao baixar mídia da mensagem ${messageId}:`, error);
    throw error;
  }
};

/**
 * Checks if a message has downloadable media
 */
export const checkMessageHasMedia = async (messageId: string): Promise<{
  hasMedia: boolean;
  contentType?: string;
  filename?: string;
  error?: string;
}> => {
  try {
    // Use HEAD request to check without downloading
    const response = await api.head(`/messages/${messageId}/download`);
    
    if (response.status === 200) {
      const contentType = response.headers['content-type'];
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1];
      
      return {
        hasMedia: true,
        contentType,
        filename
      };
    }
    
    return { hasMedia: false };
  } catch (error: unknown) {
    const errorResponse = error as { response?: { status?: number }; message?: string };
    return { 
      hasMedia: false, 
      error: errorResponse.response?.status === 404 ? 'Media not found' : errorResponse.message || 'Unknown error'
    };
  }
};

export const sendVideoMessage = async (
  chatLogId: string,
  videoFile: File,
  caption?: string
): Promise<MediaMessageResponse> => {
  try {
    console.log(`Sending video message to chat log ID ${chatLogId}...`);
    
    const formData = new FormData();
    formData.append('file', videoFile);
    
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await api.post<MediaMessageResponse>(
      `/chat-logs/${chatLogId}/send-video-message`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Video message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending video message to chat log ID ${chatLogId}:`, error);
    throw error;
  }
}; 