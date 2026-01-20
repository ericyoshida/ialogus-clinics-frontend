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
  agentName: string;
  additionalInstructions: string;
  humanChatConditions: string;
  productsListId: string;
  connectedChannels?: ConnectedChannel[];
  todayActiveConversationsCount?: number;
  createdAt: string;
  updatedAt: string;
  // Campos legados mantidos para compatibilidade
  botModelId?: string;
  botName?: string;
  departmentId?: string;
  departmentName?: string;
  macroDepartmentName?: string;
  messagesFlowchart?: MessagesFlowchart | null;
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
      // Mapear os dados para incluir campos legados para compatibilidade
      return response.data.agents.map(agent => ({
        ...agent,
        botModelId: agent.agentId,
        botName: agent.agentName,
      }));
    }

    // Se não houver estrutura esperada mas for um array, retorna o array diretamente
    if (Array.isArray(response.data)) {
      console.log('Resposta é um array direto:', response.data.length);
      return response.data.map(agent => ({
        ...agent,
        botModelId: agent.agentId,
        botName: agent.agentName,
      }));
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

    // Buscar todos os agentes da clínica e filtrar pelo ID
    const agents = await getClinicAgents(clinicId);
    const agent = agents.find(a => a.agentId === agentId || a.botModelId === agentId);

    if (agent) {
      console.log('Agente encontrado:', agent);
      return agent;
    }

    console.warn('Agente não encontrado');
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
    console.log(`Buscando agentes para o canal WhatsApp ${whatsappChannelId}...`);
    const response = await api.get<AgentsResponse>(`/whatsapp-channels/${whatsappChannelId}/agents`);
    console.log('Resposta completa da API:', response.data);

    // Verificar se a resposta contém a propriedade agents
    if (response.data && 'agents' in response.data) {
      console.log('Agentes encontrados:', response.data.agents.length);
      // Mapear os dados para incluir campos legados para compatibilidade
      return response.data.agents.map(agent => ({
        ...agent,
        botModelId: agent.agentId,
        botName: agent.agentName,
      }));
    }

    // Se não houver estrutura esperada mas for um array, retorna o array diretamente
    if (Array.isArray(response.data)) {
      console.log('Resposta é um array direto:', response.data.length);
      return response.data.map(agent => ({
        ...agent,
        botModelId: agent.agentId,
        botName: agent.agentName,
      }));
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
export const createAgent = async (clinicId: string, data: {
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

    // Mapear resposta para incluir campos legados
    const agent = response.data.agent || response.data;
    return {
      ...agent,
      botModelId: agent.agentId,
      botName: agent.agentName,
    };
  } catch (error: any) {
    console.error(`Erro ao criar agente:`, error);
    if (error.response) {
      console.error('Resposta do erro:', error.response.data);
      console.error('Status:', error.response.status);
    }
    throw error;
  }
};

/**
 * @deprecated Use createAgent instead
 */
export const createBotModel = createAgent;

export const agentsService = {
  getClinicAgents,
  getAgentById,
  getBotModelsByWhatsappChannelId,
  createAgent,
  createBotModel, // Mantido para compatibilidade
}; 