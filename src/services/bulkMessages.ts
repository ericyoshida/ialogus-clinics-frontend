import { api } from '.';

export interface SendBulkMessageRequest {
  customersIds: string[];
}

export interface SendBulkMessageResponse {
  jobId: string;
  summary: {
    total: number;
    sent: number;
    failed: number;
    successRate: number;
    processingTimeMs: number;
  };
  successfulSends: Array<{
    customerId: string;
    phoneNumber: string;
  }>;
  failedSends: Array<{
    customerId: string;
    phoneNumber: string;
    error: string;
    errorCode: string;
  }>;
  errorSummary: Record<string, {
    count: number;
    description: string;
    customers: Array<{
      customerId: string;
      phoneNumber: string;
    }>;
  }>;
}

export interface BulkSendProgress {
  jobId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  total: number;
  sent: number;
  failed: number;
  inProgress: number;
  queue: Array<{
    customerId: string;
    customerPhoneNumber: string;
    status: 'pending' | 'in_progress' | 'sent' | 'failed';
    error?: string;
    errorCode?: string;
  }>;
  startTime: number;
  endTime?: number;
  progressPercentage: number;
}

/**
 * Envia mensagem template para múltiplos contatos
 * @param agentId ID do agente
 * @param whatsappChannelId ID do canal WhatsApp
 * @param whatsappMessageTemplateId ID do template de mensagem
 * @param customersIds Array de IDs dos clientes
 * @returns Resposta do envio com jobId
 */
export const sendBulkTemplateMessage = async (
  agentId: string,
  whatsappChannelId: string,
  whatsappMessageTemplateId: string,
  customersIds: string[]
): Promise<SendBulkMessageResponse> => {
  try {
    console.log('Enviando mensagem em massa:', {
      agentId,
      whatsappChannelId,
      whatsappMessageTemplateId,
      customersCount: customersIds.length
    });

    const response = await api.post<SendBulkMessageResponse>(
      `/agents/${agentId}/channels/${whatsappChannelId}/whatsapp-message-templates/${whatsappMessageTemplateId}/send-message-template`,
      {
        customersIds
      }
    );

    console.log('Resposta do envio com jobId:', response.data.jobId);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem em massa:', error);
    throw error;
  }
};

/**
 * Consulta o progresso de um job de envio em massa
 * @param agentId ID do agente
 * @param whatsappChannelId ID do canal WhatsApp
 * @param whatsappMessageTemplateId ID do template de mensagem
 * @param jobId ID do job de envio
 * @returns Progresso atual do envio
 */
export const getBulkSendProgress = async (
  agentId: string,
  whatsappChannelId: string,
  whatsappMessageTemplateId: string,
  jobId: string
): Promise<BulkSendProgress> => {
  try {
    console.log(`Consultando progresso do job: ${jobId}`);

    const response = await api.get<BulkSendProgress>(
      `/agents/${agentId}/channels/${whatsappChannelId}/whatsapp-message-templates/${whatsappMessageTemplateId}/send-message-template/progress/${jobId}`
    );

    console.log(`Progresso do job ${jobId}:`, {
      status: response.data.status,
      progress: response.data.progressPercentage,
      sent: response.data.sent,
      failed: response.data.failed,
      total: response.data.total
    });

    return response.data;
  } catch (error) {
    console.error(`Erro ao consultar progresso do job ${jobId}:`, error);
    throw error;
  }
};

export const bulkMessagesService = {
  sendBulkTemplateMessage,
  getBulkSendProgress,
}; 