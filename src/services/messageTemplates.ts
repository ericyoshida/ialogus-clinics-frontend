import api from "@/services/api";
import { getUserId } from './auth';

class WhatsappApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhatsappApiError';
  }
}

export interface WhatsappMessageTemplate {
  whatsappMessageTemplateId: string;
  whatsappChannelId: string;
  messageTemplateId: string;
  messageTemplateName: string;
  messageTemplateLanguage: string;
  messageTemplateStatus: string;
  category: string;
  allowCategoryChange: boolean;
  whatsappMessageTemplateBody: {
    bodyText: string;
    bodyVariables: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface MessageTemplatesResponse {
  whatsappMessageTemplates: WhatsappMessageTemplate[];
}

interface WhatsappMessageTemplatesResponse {
  whatsappMessageTemplates: WhatsappMessageTemplate[];
  totalCount: number;
  currentPage: number;
  perPage: number;
}

// Interfaces para os componentes do template
interface BodyComponentExample {
  body_text: string[][];
}

interface BodyComponent {
  type: 'BODY';
  text: string;
  example?: BodyComponentExample;
}

/**
 * Busca os templates de mensagem associados a um bot model específico
 * @param botModelId ID do bot model (agente)
 * @returns Array de templates de mensagem
 */
export const getBotModelMessageTemplates = async (botModelId: string): Promise<WhatsappMessageTemplate[]> => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`Buscando templates de mensagem para o bot model ${botModelId}...`);
    const response = await api.get<MessageTemplatesResponse>(`/bot-models/${botModelId}/whatsapp-message-templates`);
    console.log('Resposta completa da API:', response.data);
    
    // Verificar se a resposta contém a propriedade whatsappMessageTemplates
    if (response.data && 'whatsappMessageTemplates' in response.data) {
      console.log('Templates encontrados:', response.data.whatsappMessageTemplates.length);
      return response.data.whatsappMessageTemplates;
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
    console.error(`Erro ao buscar templates do bot model ${botModelId}:`, error);
    throw error;
  }
};

/**
 * Busca os templates de mensagem associados a um canal WhatsApp específico
 * @param whatsappChannelId ID do canal WhatsApp
 * @returns Array de templates de mensagem
 */
export const getWhatsappChannelMessageTemplates = async (
  channelId: string,
  page: number = 1,
  perPage: number = 10
): Promise<WhatsappMessageTemplatesResponse> => {
  try {
    console.log(`Buscando templates do canal ${channelId}, página ${page}...`);
    const response = await api.get(
      `/whatsapp-channels/${channelId}/message-templates?page=${page}&per_page=${perPage}`
    );
    console.log('Resposta:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar templates do canal ${channelId}:`, error);
    throw error;
  }
};

/**
 * Busca templates de mensagem WhatsApp por bot model ID e WhatsApp channel ID
 * @param botModelId ID do bot model (agente)
 * @param whatsappChannelId ID do canal WhatsApp
 * @param page Página para paginação (padrão: 1)
 * @param perPage Itens por página (padrão: 10)
 * @returns Response com templates de mensagem WhatsApp
 */
export const getWhatsappMessageTemplatesByBotModelAndChannel = async (
  botModelId: string,
  whatsappChannelId: string,
  page: number = 1,
  perPage: number = 10
): Promise<WhatsappMessageTemplatesResponse> => {
  try {
    console.log(`Buscando templates para bot model ${botModelId} e canal ${whatsappChannelId}, página ${page}...`);
    const response = await api.get(
      `/bot-models/${botModelId}/whatsapp-channels/${whatsappChannelId}/message-templates?page=${page}&per_page=${perPage}`
    );
    console.log('Resposta:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar templates para bot model ${botModelId} e canal ${whatsappChannelId}:`, error);
    throw error;
  }
};

/**
 * Busca um template de mensagem específico por ID
 * Como não existe uma rota direta para buscar por ID, usa estratégias alternativas
 * @param templateId ID do template
 * @returns Template de mensagem
 */
export const getWhatsappMessageTemplateById = async (templateId: string): Promise<WhatsappMessageTemplate> => {
  try {
    console.log(`Buscando template com ID ${templateId}...`);
    
    // Estratégia 1: Tentar buscar através da rota direta (pode não existir)
    try {
      const response = await api.get<WhatsappMessageTemplate>(`/whatsapp-message-templates/${templateId}`);
      console.log('Template encontrado via rota direta:', response.data);
      return response.data;
    } catch (directError) {
      console.log('Rota direta não disponível, tentando estratégia alternativa...');
      
      // Estratégia 2: Como não há rota direta, precisamos buscar através dos dados já carregados
      // ou usar uma abordagem diferente. Por enquanto, vamos lançar um erro mais específico
      throw new Error(`Não foi possível encontrar o template com ID ${templateId}. A rota para buscar templates individuais não está disponível no backend.`);
    }
  } catch (error) {
    console.error(`Erro ao buscar template ${templateId}:`, error);
    throw error;
  }
};

/**
 * Cria um novo template de mensagem WhatsApp via API
 * @param whatsappChannelId ID do canal WhatsApp
 * @param templateData Dados do template a ser criado
 * @returns Resposta da criação do template
 */
export const createWhatsappTemplate = async (
  whatsappChannelId: string,
  templateData: {
    name: string;
    category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
    language: string;
    bodyText: string;
    bodyVariables: string[];
  }
): Promise<{
  success: boolean;
  templateId: string;
  localTemplateId: string;
}> => {
  try {
    console.log(`Criando template para canal ${whatsappChannelId}:`, templateData);
    
    // Processar o texto do body para formatar as variáveis com números
    let processedBodyText = templateData.bodyText;
    templateData.bodyVariables.forEach((variable, index) => {
      // Substituir {{variableName}} por {{1}}, {{2}}, etc.
      const variablePattern = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
      processedBodyText = processedBodyText.replace(variablePattern, `{{${index + 1}}}`);
    });

    // Preparar componentes baseados nos dados do template
    const bodyComponent: BodyComponent = {
      type: 'BODY',
      text: processedBodyText,
    };

    // Se houver variáveis, adicionar exemplo
    if (templateData.bodyVariables.length > 0) {
      const exampleValues = templateData.bodyVariables.map((variable, index) => {
        // Para a primeira variável (geralmente nome), usar "João"
        // Para outras variáveis, usar valores de exemplo genéricos
        if (index === 0) {
          return "João";
        } else {
          return `Exemplo${index + 1}`;
        }
      });

      bodyComponent.example = {
        body_text: [exampleValues]
      };
    }

    const components = [bodyComponent];

    const payload = {
      name: templateData.name,
      category: templateData.category,
      language: templateData.language,
      components,
      bodyText: processedBodyText, // Usar o texto processado com números
      bodyVariables: templateData.bodyVariables,
    };

    console.log('Payload sendo enviado:', JSON.stringify(payload, null, 2));

    const response = await api.post(
      `/whatsapp-channels/${whatsappChannelId}/whatsapp-templates/api`,
      payload
    );

    console.log('Template criado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao criar template para canal ${whatsappChannelId}:`, error);
    
    // Log detalhado do erro para debug
    if (error.response) {
      console.error('Dados da resposta de erro:', error.response.data);
      console.error('Status do erro:', error.response.status);
      console.error('Headers do erro:', error.response.headers);
    } else if (error.request) {
      console.error('Erro na requisição:', error.request);
    } else {
      console.error('Erro geral:', error.message);
    }
    
    throw error;
  }
};

/**
 * Atualiza um template de mensagem WhatsApp específico
 * @param templateId ID do template
 * @param templateData Dados do template a serem atualizados
 * @returns Resposta da atualização do template
 */
export const updateWhatsappTemplate = async (
  templateId: string,
  templateData: {
    category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
    bodyText: string;
    bodyVariables: string[];
  }
): Promise<{
  success: boolean;
  templateId: string;
  apiSuccess?: boolean;
}> => {
  try {
    console.log(`Atualizando template ${templateId}:`, templateData);
    
    // Processar o texto do body para formatar as variáveis com números (se necessário)
    let processedBodyText = templateData.bodyText;
    templateData.bodyVariables.forEach((variable, index) => {
      // Substituir {{variableName}} por {{1}}, {{2}}, etc.
      const variablePattern = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
      processedBodyText = processedBodyText.replace(variablePattern, `{{${index + 1}}}`);
    });

    // Preparar componentes para a API do WhatsApp
    const bodyComponent: BodyComponent = {
      type: 'BODY',
      text: processedBodyText,
    };

    // Se houver variáveis, adicionar exemplo
    if (templateData.bodyVariables.length > 0) {
      const exampleValues = templateData.bodyVariables.map((variable, index) => {
        // Para a primeira variável (geralmente nome), usar "João"
        // Para outras variáveis, usar valores de exemplo genéricos
        if (index === 0) {
          return "João";
        } else {
          return `Exemplo${index + 1}`;
        }
      });

      bodyComponent.example = {
        body_text: [exampleValues]
      };
    }

    const components = [bodyComponent];

    const payload = {
      category: templateData.category,
      components, // Incluir componentes para API do WhatsApp
      bodyText: templateData.bodyText.trim(), // Dados locais
      bodyVariables: templateData.bodyVariables, // Dados locais
    };

    console.log('Payload sendo enviado para atualização:', JSON.stringify(payload, null, 2));

    const response = await api.put(
      `/whatsapp-message-templates/${templateId}/api`,
      payload
    );

    console.log('Template atualizado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar template ${templateId}:`, error);
    
    // Log detalhado do erro para debug
    if (error.response) {
      console.error('Dados da resposta de erro:', error.response.data);
      console.error('Status do erro:', error.response.status);
      console.error('Headers do erro:', error.response.headers);
      
      // Verificar se é um erro específico da API do WhatsApp
      if (error.response?.status === 400 && 
          error.response?.data?.message === "Whatsapp Request Failed") {
        // Erro específico da API do WhatsApp relacionado à limitação de edição
        const whatsappErrorMessage = "⚠️ Limitação da API do WhatsApp: Templates aprovados podem ser editados apenas uma vez a cada 24 horas e apenas a categoria pode ser alterada.";
        throw new WhatsappApiError(whatsappErrorMessage);
      }
    } else if (error.request) {
      console.error('Erro na requisição:', error.request);
    } else {
      console.error('Erro geral:', error.message);
    }
    
    throw error;
  }
};

/**
 * Atualiza templates de WhatsApp de um canal específico
 * @param whatsappChannelId ID do canal WhatsApp
 * @returns Resposta da atualização dos templates
 */
export const updateWhatsappTemplates = async (whatsappChannelId: string): Promise<void> => {
  try {
    console.log(`Atualizando templates do canal ${whatsappChannelId}...`);
    
    await api.put(`/whatsapp-channels/${whatsappChannelId}/whatsapp-message-templates`);
    
    console.log('Templates atualizados com sucesso');
  } catch (error) {
    console.error(`Erro ao atualizar templates do canal ${whatsappChannelId}:`, error);
    throw error;
  }
};

export const messageTemplatesService = {
  getBotModelMessageTemplates,
  getWhatsappChannelMessageTemplates,
  getWhatsappMessageTemplatesByBotModelAndChannel,
  getWhatsappMessageTemplateById,
  createWhatsappTemplate,
  updateWhatsappTemplate,
  updateWhatsappTemplates,
}; 