import { MessageNodeData } from '@/pages/conversations/FlowEditorPage'
import axios from 'axios'
import { API_CONFIG } from '@/config/api'

// Configuração do axios (export default original)
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

// Interceptador para adicionar token de autorização
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ialogus:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para lidar com respostas e erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('ialogus:token');
      localStorage.removeItem('ialogus:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export default original para compatibilidade
export default api;

// Export da instância para uso no ApiService
export { api }

// Novas interfaces e serviços para o FlowEditor
export interface CreateMessageBlockRequest {
  isFirstMessage: boolean;
  isLastMessage: boolean;
  previousMessageBlockId?: string;
  messagePurpose: string;
  messageExamples: string[];
  positiveBlockId?: string;
  negativeBlockId?: string;
  timeIntervalBetweenMessages: number;
  maximumWaitTime: number;
  haveParticularCondition: boolean;
  condition?: string;
  dataCollectionFields?: string[];
}

export interface CreateMessagesFlowchartRequest {
  name: string;
  messageBlockSequenceIds: string[];
}

export interface CreateMessageBlockResponse {
  messageBlock: {
    id: string;
    // outros campos do message block
  };
}

export interface CreateMessagesFlowchartResponse {
  messagesFlowchart: {
    id: string;
    // outros campos do flowchart
  };
}

export class ApiService {
  static async createMessagesFlowchart(
    clinicId: string,
    data: CreateMessagesFlowchartRequest
  ): Promise<CreateMessagesFlowchartResponse> {
    const response = await api.post(`/seller-companies/${clinicId}/messages-flowcharts`, data);
    return response.data;
  }

  static async editMessagesFlowchart(
    messagesFlowchartId: string,
    data: { name?: string; messageBlockSequenceIds: string[] }
  ): Promise<void> {
    await api.put(`/messages-flowcharts/${messagesFlowchartId}`, data);
  }
  
  static async deleteMessageBlock(
    messageBlockId: string
  ): Promise<void> {
    await api.delete(`/message-blocks/${messageBlockId}`);
  }
  
  static async editMessageBlock(
    messageBlockId: string,
    data: Partial<CreateMessageBlockRequest>
  ): Promise<void> {
    await api.put(`/message-blocks/${messageBlockId}`, data);
  }

  static async deleteMessagesFlowchart(
    messagesFlowchartId: string
  ): Promise<void> {
    await api.delete(`/messages-flowcharts/${messagesFlowchartId}`);
  }

  static async createFlowchartFromTemplate(
    clinicId: string,
    data: {
      templateType: 'sales_general' | 'sales_scheduling';
      name: string;
    }
  ): Promise<{ messagesFlowchart: { id: string; name: string } }> {
    const response = await api.post(
      `/seller-companies/${clinicId}/messages-flowcharts/from-template`,
      data
    );
    return response.data;
  }

  static async createMessageBlock(
    messagesFlowchartId: string,
    data: CreateMessageBlockRequest
  ): Promise<CreateMessageBlockResponse> {
    const response = await api.post(`/messages-flowcharts/${messagesFlowchartId}/message-blocks`, data);
    return response.data;
  }

  static mapNodeDataToCreateRequest(
    nodeData: MessageNodeData,
    messagesFlowchartId: string,
    previousBlockId?: string
  ): CreateMessageBlockRequest {
    return {
      isFirstMessage: nodeData.isStartNode || false,
      isLastMessage: !nodeData.yesDestination && !nodeData.noDestination && !nodeData.hasCondition,
      previousMessageBlockId: previousBlockId,
      messagePurpose: nodeData.messagePurpose,
      messageExamples: nodeData.examples,
      positiveBlockId: nodeData.yesDestination || undefined,
      negativeBlockId: nodeData.noDestination || undefined,
      timeIntervalBetweenMessages: nodeData.timing.interval,
      maximumWaitTime: nodeData.timing.maxWait,
      haveParticularCondition: nodeData.hasCondition,
      condition: nodeData.hasCondition ? nodeData.conditionQuestion : undefined,
      dataCollectionFields: nodeData.dataCollection,
    };
  }

  static async listMessagesFlowcharts(
    clinicId: string
  ): Promise<{ messagesFlowcharts: Array<{ id: string; name: string; createdAt: string }> }> {
    const response = await api.get(`/seller-companies/${clinicId}/messages-flowcharts`);
    return response.data;
  }

  static async getMessagesFlowchart(
    messagesFlowchartId: string
  ): Promise<{ 
    messagesFlowchart: { 
      id: string; 
      name: string; 
      messageBlockSequence: Array<{
        id: string;
        isFirstMessage: boolean;
        isLastMessage: boolean;
        previousMessageBlockId: string | null;
        messagePurpose: string;
        messageExamples: string[];
        positiveBlockId: string | null;
        negativeBlockId: string | null;
        timeIntervalBetweenMessages: number;
        maximumWaitTime: number;
        haveParticularCondition: boolean;
        condition: string | null;
        dataCollectionFields: string[];
      }> 
    } 
  }> {
    const response = await api.get(`/messages-flowcharts/${messagesFlowchartId}`);
    return response.data;
  }
} 