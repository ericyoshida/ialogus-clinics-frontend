import { AgentCard } from '@/components/agents/AgentCard'
import { BulkMessageStepIndicator } from '@/components/ui/bulk-message-step-indicator'
import { useBulkMessageForm } from '@/hooks/use-bulk-message-form'
import { useClinics } from '@/hooks/use-clinics'
import { useToast } from '@/hooks/use-toast'
import { agentsService } from '@/services'
import type { Agent } from '@/services/agents'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// Lista de etapas do fluxo de envio de mensagens - agora com 4 etapas
const BULK_MESSAGE_STEPS = [
  "Selecionar Canal",
  "Selecionar Agente",
  "Selecionar Template", 
  "Selecionar Contatos"
];

// Card de agente selecionável
function SelectableBotModelCard({ 
  agent, 
  selected, 
  onClick,
  clinicId
}: { 
  agent: Agent;
  selected: boolean;
  onClick: () => void;
  clinicId?: string;
}) {
  const navigate = useNavigate();

  const formatName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleEditAgent = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log('Editar agente:', agent.agentName);
    // No contexto do fluxo de envio em massa, não navegar para outra página
    // TODO: Implementar modal de edição ou outra solução
    // navigate(`/dashboard/clinic/${clinicId}/agents?editAgent=${agent.agentId}`);
  };

  const handleDeleteAgent = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log('Deletar agente:', agent.agentName);
    // TODO: Implementar confirmação e deleção de agente
    // navigate(`/dashboard/agents?deleteAgent=${agent.agentId}`);
  };

  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      {selected && (
        <div className="absolute -top-5 left-3 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white">
          Selecionado
        </div>
      )}
      
      <div className="w-full h-full">
        <AgentCard
          name={formatName(agent.agentName)}
          type="Agente de IA"
          conversationsToday={agent.todayActiveConversationsCount || 0}
          activeChannels={agent.connectedChannels?.map(channel => channel.channelType.toLowerCase()) || ['chat']}
          onClick={onClick}
          className={`h-full w-full ${selected ? 'ring-2 ring-offset-2 ring-orange-500' : ''}`}
          showMenu={false}
        />
      </div>
      
      {selected && (
        <div 
          className="absolute inset-0 z-5 rounded-lg pointer-events-none bg-orange-500 opacity-10"
        />
      )}
    </div>
  );
}

// Card para criar novo agente
function AddAgentCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      <div 
        onClick={onClick}
        className="w-full h-full cursor-pointer hover:scale-105 transition-all duration-200 group"
      >
        <img 
          src="/images/add-agent.svg" 
          alt="Criar Novo Agente"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

export default function SelectAgentPage() {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  const { selectedChannelId, selectedAgentId, updateFormData, formData } = useBulkMessageForm();
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();
  
  // Buscar nome da clínica
  const { clinics } = useClinics();
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...';
  
  // Estados para bot models
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar bot models quando o componente montar
  useEffect(() => {
    console.log('📌 useEffect disparado - selectedChannelId:', selectedChannelId);
    
    const fetchBotModels = async () => {
      if (!selectedChannelId) {
        console.error('Nenhum canal selecionado para buscar bot models');
        setError('Nenhum canal selecionado');
        setLoadingAgents(false);
        return;
      }

      try {
        setLoadingAgents(true);
        setError(null);
        console.log('🔍 Buscando bot models para o canal:', selectedChannelId);
        console.log('🏢 Clínica atual:', clinicId);
        
        const botModelsData = await agentsService.getBotModelsByWhatsappChannelId(selectedChannelId);
        console.log('✅ Bot models carregados:', botModelsData);
        console.log('📊 Quantidade de bot models:', botModelsData.length);
        
        setAllAgents(botModelsData);
        
        if (botModelsData.length === 0) {
          console.warn('⚠️ Nenhum bot model encontrado para o canal:', selectedChannelId);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar bot models:', err);
        setError('Erro ao carregar agentes do canal');
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchBotModels();
  }, [selectedChannelId, clinicId]); // Removido formData das dependências

  // Configurações de paginação
  const agentsPerPage = 6;
  const totalPages = Math.ceil(allAgents.length / agentsPerPage);
  
  // Obter os agentes para a página atual
  const getCurrentPageAgents = () => {
    const start = currentPage * agentsPerPage;
    const end = start + agentsPerPage;
    return allAgents.slice(start, end);
  };

  // Funções de navegação de páginas
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleAgentSelect = (agentId: string) => {
    console.log('🎯 Selecionando agente:', agentId);

    // Encontrar o agente completo nos dados carregados
    const selectedAgent = allAgents.find(agent => agent.agentId === agentId);

    if (selectedAgent) {
      console.log('✅ Agente encontrado, atualizando formData');
      updateFormData({
        selectedAgentId: agentId,
        selectedAgentData: {
          agentId: selectedAgent.agentId,
          agentName: selectedAgent.agentName,
          clinicId: selectedAgent.clinicId,
        },
        step: 1
      });
    } else {
      console.log('⚠️ Agente não encontrado na lista');
      updateFormData({ selectedAgentId: agentId, step: 1 });
    }
  };

  const handleNext = () => {
    if (selectedAgentId) {
      // Navegar para a próxima etapa (Selecionar Templates)
      navigate(`/dashboard/clinic/${clinicId}/messages/bulk/template`);
    } else {
      toast({
        title: "Seleção necessária",
        description: "Por favor, selecione um agente para continuar",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    // Voltar para seleção de canal
    navigate(`/dashboard/clinic/${clinicId}/messages/bulk/channel`);
  };

  const handleCreateAgent = () => {
    // Navegar para a página de criação de agentes
    navigate(`/dashboard/clinic/${clinicId}/agents/create`);
  };

  // Verificar se pode prosseguir
  const canProceed = Boolean(selectedAgentId);

  // Obter agentes da página atual
  const currentAgents = getCurrentPageAgents();

  return (
    <div className="max-w-7xl h-[calc(100vh-80px)] flex flex-col -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Header com título e subtítulo seguindo o padrão da criação de agentes */}
      <div className="flex flex-col mb-1">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Enviar Mensagem Quebra-gelo
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{clinicName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Defina os detalhes da mensagem a ser enviada para seus clientes.</p>
        
        <div className="w-full mb-6">
          <BulkMessageStepIndicator 
            steps={BULK_MESSAGE_STEPS} 
            currentStep={1} 
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-medium text-gray-800">Selecionar Agente</h2>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-1">Etapa 2: Escolha o agente conectado ao canal selecionado</p>
      </div>

      {/* Cards de agentes */}
      <div className="mb-2">
        {loadingAgents ? (
          // Estado de carregamento
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse space-y-4">
              <div className="flex space-x-10">
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
              </div>
              <p className="text-center text-gray-500">Carregando agentes...</p>
            </div>
          </div>
        ) : error ? (
          // Mensagem de erro
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : allAgents.length === 0 ? (
          // Caso especial: quando não há agentes, mostrar apenas o card de criar
          <div className="overflow-x-auto overflow-y-hidden py-1">
            <div className="flex gap-5 min-w-max px-1 py-1">
              <AddAgentCard onClick={handleCreateAgent} />
            </div>
          </div>
        ) : (
          // Agentes existentes com card de criar no início
          <div className="overflow-x-auto overflow-y-hidden py-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
            <div className="flex gap-5 min-w-max px-1 py-1">
              {/* Card para criar novo agente - sempre no início */}
              <AddAgentCard onClick={handleCreateAgent} />
              
              {currentAgents.map((agent) => (
                <SelectableBotModelCard
                  key={agent.agentId}
                  agent={agent}
                  selected={selectedAgentId === agent.agentId}
                  onClick={() => handleAgentSelect(agent.agentId)}
                  clinicId={clinicId}
                />
              ))}
            </div>
            
            {/* Navegação de páginas se houver múltiplas páginas */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-2 space-x-4">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-1" />
                  Anterior
                </button>
                
                <span className="text-sm text-gray-600">
                  Página {currentPage + 1} de {totalPages}
                </span>
                
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Botões de navegação */}
      <div className="flex mt-4">
        <button
          onClick={handleBack}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          onClick={handleNext}
          className={`px-5 py-2 rounded-md text-white transition-all duration-200 ${
            (!canProceed || loadingAgents) 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:shadow-lg'
          }`}
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)'
          }}
          disabled={!canProceed || loadingAgents}
        >
          Próximo
        </button>
      </div>
    </div>
  );
} 