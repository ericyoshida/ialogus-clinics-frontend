import { api } from '.';

export interface WhatsappChannel {
  id: string;
  clinicId: string;
  botModelsIDList: string[];
  botName: string;
  phoneNumber: string;
  operationalRegion: string;
  additionalInstructions: string;
  whatsappPhoneNumberId: string;
  createdAt: string;
  updatedAt: string | null;
}

interface WhatsappChannelsResponse {
  whatsappChannels: WhatsappChannel[];
}

export interface MetaBusinessAccount {
  id: string;
  name: string;
  verificationStatus: string;
}

export interface WhatsAppPhoneNumber {
  id: string;
  displayPhoneNumber: string;
  qualityRating: string;
  status: string;
}

export interface OAuthResponse {
  success: boolean;
  businessAccounts?: MetaBusinessAccount[];
  error?: string;
}

export interface EmbeddedSignupRequest {
  code: string;
  companyId: string;
}

export interface EmbeddedSignupResponse {
  success: boolean;
  accessToken: string;
  wabaId: string;
  phoneNumbers: Array<{
    id: string;
    displayPhoneNumber: string;
    verifiedName: string;
    qualityRating: string;
  }>;
  error?: string;
}

export interface CreateChannelData {
  phoneNumber: string;
  botModelsIds: string[];
  additionalInstructions: string;
  operationalRegion: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  metaBusinessAccountId: string;
  botName: string;
  waitTimeoutToEndChatLog: number;
  isEmbeddedSignup?: boolean;
  embeddedAccessToken?: string;
}

/**
 * Busca os canais WhatsApp de uma empresa
 */
export const getWhatsappChannelsByCompanyId = async (clinicId: string): Promise<WhatsappChannel[]> => {
  try {
    console.log('Buscando canais WhatsApp da empresa:', clinicId);
    const response = await api.get<any>(
      `/seller-companies/${clinicId}/whatsapp-channels`
    );
    
    console.log('Canais WhatsApp recebidos:', response.data.whatsappChannels);
    
    // Se a resposta vier em formato aninhado, extrair os canais
    if (Array.isArray(response.data.whatsappChannels)) {
      return response.data.whatsappChannels.map((item: any) => {
        // Se o item tem um objeto whatsappChannel aninhado, extraí-lo
        if (item.whatsappChannel) {
          return item.whatsappChannel;
        }
        // Caso contrário, retornar o item como está
        return item;
      });
    }
    
    return response.data.whatsappChannels || [];
  } catch (error) {
    console.error('Erro ao buscar canais WhatsApp:', error);
    throw error;
  }
};

/**
 * Inicia o fluxo OAuth do Meta retornando a URL de autorização
 */
export const initiateMetaOAuth = async (companyId?: string): Promise<{ authUrl: string }> => {
  try {
    // Se temos companyId, tentar usar POST (nova versão)
    if (companyId) {
      try {
        const response = await api.post('/whatsapp-channels/oauth/authorize', {
          companyId
        });
        return response.data;
      } catch (postError: any) {
        // Se POST falhar com 404, fazer fallback para GET
        if (postError?.response?.status === 404) {
          console.log('POST não disponível, usando GET sem companyId');
          const response = await api.get('/whatsapp-channels/oauth/authorize');
          return response.data;
        }
        throw postError;
      }
    } else {
      // Sem companyId, usar GET
      const response = await api.get('/whatsapp-channels/oauth/authorize');
      return response.data;
    }
  } catch (error) {
    console.error('Erro ao iniciar OAuth:', error);
    throw error;
  }
};

/**
 * Troca o código de autorização por tokens de acesso
 */
export const exchangeCodeForTokens = async (code: string, state?: string): Promise<OAuthResponse> => {
  try {
    const response = await api.post('/whatsapp-channels/oauth/callback', {
      code,
      state
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao trocar código por tokens:', error);
    throw error;
  }
};

/**
 * Lista as contas Meta Business disponíveis
 */
export const getMetaBusinessAccounts = async (): Promise<MetaBusinessAccount[]> => {
  try {
    const response = await api.get('/whatsapp-channels/meta/business-accounts');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar contas Meta Business:', error);
    throw error;
  }
};

/**
 * Lista os números WhatsApp disponíveis para uma conta
 */
export const getWhatsAppNumbers = async (accountId: string): Promise<WhatsAppPhoneNumber[]> => {
  try {
    const response = await api.get(`/whatsapp-channels/meta/phone-numbers/${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar números WhatsApp:', error);
    throw error;
  }
};

/**
 * Cria um novo canal WhatsApp
 */
export const createWhatsAppChannel = async (
  clinicId: string, 
  data: CreateChannelData
): Promise<WhatsappChannel> => {
  try {
    const response = await api.post(`/seller-companies/${clinicId}/whatsapp-channels`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar canal WhatsApp:', error);
    throw error;
  }
};

/**
 * Verifica a disponibilidade de números WhatsApp
 */
export const checkWhatsAppNumbersAvailability = async (
  phoneNumberIds: string[]
): Promise<Record<string, { inUse: boolean; channelName?: string }>> => {
  try {
    const response = await api.post('/whatsapp-channels/check-availability', { phoneNumberIds });
    return response.data.availability;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade dos números:', error);
    throw error;
  }
};

/**
 * Atualiza um canal WhatsApp existente
 */
export const updateWhatsAppChannel = async (
  channelId: string,
  data: Partial<CreateChannelData>
): Promise<WhatsappChannel> => {
  try {
    const response = await api.put(`/whatsapp-channels/${channelId}`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar canal WhatsApp:', error);
    throw error;
  }
};

/**
 * Busca um canal WhatsApp específico
 */
export const getWhatsAppChannelById = async (
  channelId: string
): Promise<WhatsappChannel> => {
  try {
    const response = await api.get(`/whatsapp-channels/${channelId}`);
    return response.data.whatsappChannel;
  } catch (error) {
    console.error('Erro ao buscar canal WhatsApp:', error);
    throw error;
  }
};

/**
 * Busca as métricas de um canal WhatsApp
 */
export const getWhatsAppChannelMetrics = async (channelId: string) => {
  try {
    const response = await api.get(`/whatsapp-channels/${channelId}/metrics`);
    return response.data.metrics;
  } catch (error) {
    console.error('Erro ao buscar métricas do canal WhatsApp:', error);
    throw error;
  }
};

/**
 * Busca as estatísticas de um canal WhatsApp
 */
export const getWhatsAppChannelStatistics = async (channelId: string, days: number = 7) => {
  try {
    const response = await api.get(`/whatsapp-channels/${channelId}/statistics`, {
      params: { days }
    });
    return response.data.statistics;
  } catch (error) {
    console.error('Erro ao buscar estatísticas do canal WhatsApp:', error);
    throw error;
  }
};

/**
 * Exchanges embedded signup authorization code for access tokens
 */
export const exchangeEmbeddedSignupCode = async (request: EmbeddedSignupRequest): Promise<EmbeddedSignupResponse> => {
  try {
    const response = await api.post('/whatsapp-channels/embedded-signup/exchange', request);
    return response.data;
  } catch (error) {
    console.error('Error exchanging embedded signup code:', error);
    throw error;
  }
};

/**
 * Creates a WhatsApp channel using embedded signup flow
 */
export const createWhatsAppChannelEmbedded = async (
  clinicId: string,
  data: CreateChannelData & { embeddedAccessToken?: string }
): Promise<WhatsappChannel> => {
  try {
    const response = await api.post(`/seller-companies/${clinicId}/whatsapp-channels/embedded`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating WhatsApp channel via embedded signup:', error);
    throw error;
  }
};

export const channelsService = {
  getWhatsappChannelsByCompanyId,
  getWhatsAppChannelById,
  getWhatsAppChannelMetrics,
  getWhatsAppChannelStatistics,
  updateWhatsAppChannel,
  initiateMetaOAuth,
  exchangeCodeForTokens,
  getMetaBusinessAccounts,
  getWhatsAppNumbers,
  createWhatsAppChannel,
  createWhatsAppChannelEmbedded,
  checkWhatsAppNumbersAvailability,
  exchangeEmbeddedSignupCode,
}; 