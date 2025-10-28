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
  agentId: string;
  clinicId: string;
  additionalInstructions: string;
  humanChatConditions: string;
  agentName: string;
  productsListId: string;
  connectedChannels?: ConnectedChannel[];
  todayActiveConversationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Interface para a resposta da API de agentes
interface AgentsResponse {
  agents: Agent[];
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
    const response = await api.get<AgentsResponse>(`/accounts/${userId}/clinics/${clinicId}/agents`);
    console.log('Resposta completa da API:', response.data);

    // Verificar se a resposta contém a propriedade agents
    if (response.data && 'agents' in response.data) {
      console.log('Agentes encontrados:', response.data.agents.length);
      return response.data.agents;
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
    console.log(`Buscando agente ${agentId} da clínica ${clinicId}...`);
    const response = await api.get(`/clinics/${clinicId}/agents`);
    console.log('Resposta recebida:', response.data);

    // Verificar se a resposta contém um único agente
    if (response.data && response.data.agent) {
      return response.data.agent;
    }

    // Verificar se a resposta contém um array de agentes e filtrar pelo ID
    if (response.data && 'agents' in response.data) {
      const agent = response.data.agents.find((a: Agent) => a.agentId === agentId);
      if (agent) {
        return agent;
      }
    }

    // Verificar se a resposta é diretamente o agente
    if (response.data && response.data.agentId) {
      return response.data;
    }

    console.warn('Agente não encontrado ou formato não reconhecido:', response.data);
    return null;
  } catch (error) {
    console.error(`Erro ao buscar agente ${agentId} da clínica ${clinicId}:`, error);
    return null;
  }
};

/**
 * Busca os agentes associados a um canal WhatsApp específico
 * @param whatsappChannelId ID do canal WhatsApp
 * @returns Array de agentes conectados ao canal
 */
export const getBotModelsByWhatsappChannelId = async (whatsappChannelId: string): Promise<Agent[]> => {
  try {
    console.log(`Buscando agentes para o canal WhatsApp ${whatsappChannelId}...`);
    const response = await api.get<AgentsResponse>(`/whatsapp-channels/${whatsappChannelId}/agents`);
    console.log('Resposta completa da API:', response.data);

    // Verificar se a resposta contém a propriedade agents
    if (response.data && 'agents' in response.data) {
      console.log('Agentes encontrados:', response.data.agents.length);
      return response.data.agents;
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
    console.error(`Erro ao buscar agentes do canal WhatsApp ${whatsappChannelId}:`, error);
    throw error;
  }
};

/**
 * Cria um novo agente
 * @param clinicId ID da clínica
 * @param data Dados do agente
 * @returns Agente criado
 */
export const createBotModel = async (clinicId: string, data: {
  additionalInstructions: string;
  humanChatConditions: string;
  agentName: string;
  productsListId: string;
}): Promise<Agent> => {
  try {
    console.log(`Criando agente para a clínica ${clinicId}...`);
    console.log('Dados:', data);

    const response = await api.post(`/clinics/${clinicId}/agents`, data);
    console.log('Agente criado com sucesso:', response.data);

    return response.data;
  } catch (error: any) {
    console.error(`Erro ao criar agente:`, error);
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