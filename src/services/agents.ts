import { api } from '.';
import { getUserId } from './auth';

export interface MessageBlock {
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
  condition: string;
}

export interface MessagesFlowchart {
  messagesFlowchartId: string;
  messageBlocksList: MessageBlock[];
}

export interface ConnectedChannel {
  channelId: string;
  channelType: string;
  phoneNumber: string;
  channelName: string;
}

export interface Agent {
  botModelId: string;
  departmentId: string;
  departmentName: string;
  macroDepartmentName: string;
  additionalInstructions: string;
  humanChatConditions: string;
  botName: string;
  connectedChannels?: ConnectedChannel[];
  todayActiveConversationsCount?: number;
  messagesFlowchart: MessagesFlowchart | null;
  createdAt: string;
  updatedAt: string;
}

// Interface para a resposta da API de agentes
interface AgentsResponse {
  botModels: Agent[];
}

/**
 * Busca os agentes associados a uma clínica específica
 * @param clinicId ID da clínica
 * @returns Array de agentes
 */
export const getClinicAgents = async (clinicId: string): Promise<Agent[]> => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`Buscando agentes para a clínica ${clinicId} do usuário ${userId}...`);
    const response = await api.get<AgentsResponse>(`/accounts/${userId}/clinics/${clinicId}/bot-models`);
    console.log('Resposta completa da API:', response.data);
    
    // Verificar se a resposta contém a propriedade botModels
    if (response.data && 'botModels' in response.data) {
      console.log('Agentes encontrados:', response.data.botModels.length);
      return response.data.botModels;
    }
    
    // Se não houver estrutura esperada mas for um array, retorna o array diretamente
    if (Array.isArray(response.data)) {
      console.log('Resposta é um array direto:', response.data.length);
      return response.data;
    }
    
    // Caso não seja nenhum dos formatos esperados, retorna array vazio
    console.warn('Formato de resposta não reconhecido:', response.data);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar agentes da clínica ${clinicId}:`, error);
    throw error;
  }
};

export const getAgentById = async (clinicId: string, agentId: string): Promise<Agent | null> => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`Buscando agente ${agentId} da clínica ${clinicId}...`);
    const response = await api.get(`/accounts/${userId}/clinics/${clinicId}/bot-models/${agentId}`);
    console.log('Resposta recebida:', response.data);
    
    // Verificar se a resposta é diretamente o agente
    if (response.data && response.data.botModelId) {
      return response.data;
    }
    
    // Verificar se a resposta tem o agente em uma propriedade botModel
    if (response.data && response.data.botModel && response.data.botModel.botModelId) {
      return response.data.botModel;
    }
    
    console.warn('Agente não encontrado ou formato não reconhecido:', response.data);
    return null;
  } catch (error) {
    console.error(`Erro ao buscar agente ${agentId} da clínica ${clinicId}:`, error);
    return null;
  }
};

/**
 * Busca os bot models (agentes) associados a um canal WhatsApp específico
 * @param whatsappChannelId ID do canal WhatsApp
 * @returns Array de agentes conectados ao canal
 */
export const getBotModelsByWhatsappChannelId = async (whatsappChannelId: string): Promise<Agent[]> => {
  try {
    console.log(`Buscando bot models para o canal WhatsApp ${whatsappChannelId}...`);
    const response = await api.get<AgentsResponse>(`/whatsapp-channels/${whatsappChannelId}/bot-models`);
    console.log('Resposta completa da API:', response.data);
    
    // Verificar se a resposta contém a propriedade botModels
    if (response.data && 'botModels' in response.data) {
      console.log('Bot models encontrados:', response.data.botModels.length);
      return response.data.botModels;
    }
    
    // Se não houver estrutura esperada mas for um array, retorna o array diretamente
    if (Array.isArray(response.data)) {
      console.log('Resposta é um array direto:', response.data.length);
      return response.data;
    }
    
    // Caso não seja nenhum dos formatos esperados, retorna array vazio
    console.warn('Formato de resposta não reconhecido:', response.data);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar bot models do canal WhatsApp ${whatsappChannelId}:`, error);
    throw error;
  }
};

/**
 * Cria um novo bot model (agente)
 * @param departmentId ID do departamento
 * @param data Dados do bot model
 * @returns Bot model criado
 */
export const createBotModel = async (departmentId: string, data: {
  additionalInstructions: string;
  humanChatConditions: string;
  botName: string;
  productsListId: string;
  messagesFlowchartId: string;
}): Promise<Agent> => {
  try {
    console.log(`Criando bot model para o departamento ${departmentId}...`);
    console.log('Dados:', data);
    
    const response = await api.post(`/departments/${departmentId}/bot-models`, data);
    console.log('Bot model criado com sucesso:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao criar bot model:`, error);
    if (error.response) {
      console.error('Resposta do erro:', error.response.data);
      console.error('Status:', error.response.status);
    }
    throw error;
  }
};

export const agentsService = {
  getClinicAgents,
  getAgentById,
  getBotModelsByWhatsappChannelId,
  createBotModel,
}; 