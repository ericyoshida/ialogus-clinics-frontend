import { AgentCard } from '@/components/agents/AgentCard'
import { BulkMessageStepIndicator } from '@/components/ui/bulk-message-step-indicator'
import { useBulkMessageForm } from '@/hooks/use-bulk-message-form'
import { useClinics } from '@/hooks/use-clinics'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services'
import type { WhatsappChannel } from '@/services/channels'
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

// Componente de card de canal usando AgentCard
function SelectableChannelCard({ 
  channel, 
  selected, 
  onClick
}: { 
  channel: WhatsappChannel;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      {selected && (
        <div className="absolute -top-5 left-3 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white">
          Selecionado
        </div>
      )}
      
      <div className="w-full h-full">
        <AgentCard
          name={channel.channelName}
          type="Canal WhatsApp"
          conversationsToday={0}
          activeChannels={['whatsapp']}
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

// Card para criar novo canal
function AddChannelCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      <div 
        onClick={onClick}
        className="w-full h-full cursor-pointer hover:scale-105 transition-all duration-200 group"
      >
        <img 
          src="/images/add-channel.svg" 
          alt="Criar Novo Canal"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

export default function SelectChannelPage() {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  const { toast } = useToast();
  const { selectedChannelId, updateFormData, clearFormData } = useBulkMessageForm();
  const [currentPage, setCurrentPage] = useState(0);
  
  // Buscar clínicas e canais
  const { clinics, loading: loadingClinics } = useClinics();
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...';
  
  // Estados para canais
  const [allChannels, setAllChannels] = useState<WhatsappChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Limpar dados do formulário apenas quando a clínica mudar (não quando navegar entre steps)
  const [lastClinicId, setLastClinicId] = useState(clinicId);
  
  useEffect(() => {
    if (clinicId !== lastClinicId) {
      console.log('Clínica mudou, limpando dados do formulário - clínica:', clinicId);
      clearFormData();
      setLastClinicId(clinicId);
    }
  }, [clinicId, lastClinicId, clearFormData]);

  // Buscar canais da clínica selecionada quando o componente montar
  useEffect(() => {
    const fetchClinicChannels = async () => {
      if (!clinicId) {
        setError('Nenhuma clínica selecionada');
        setLoadingChannels(false);
        return;
      }

      try {
        setLoadingChannels(true);
        setError(null);
        
        // Buscar canais apenas da clínica selecionada
        console.log('Buscando canais para a clínica:', clinicId);
        const clinicChannels = await channelsService.getWhatsappChannelsByClinicId(clinicId);
        
        setAllChannels(clinicChannels);
      } catch (err) {
        console.error(`Erro ao buscar canais da clínica ${clinicId}:`, err);
        setError('Erro ao carregar canais WhatsApp');
      } finally {
        setLoadingChannels(false);
      }
    };

    fetchClinicChannels();
  }, [clinicId]);

  // Validar se o canal selecionado ainda existe após carregar a lista
  useEffect(() => {
    // Só validar após terminar de carregar e se houver canais
    if (!loadingChannels && selectedChannelId) {
      // Se não houver canais ou o canal selecionado não existir
      if (allChannels.length === 0 || !allChannels.some(channel => channel.id === selectedChannelId)) {
        console.log('Canal selecionado não é válido para esta clínica, limpando seleção');
        updateFormData({ selectedChannelId: null, selectedChannelData: null });
      }
    }
  }, [loadingChannels]); // Só depende de loadingChannels para evitar loops

  // Configurações de paginação
  const channelsPerPage = 6;
  const totalPages = Math.ceil(allChannels.length / channelsPerPage);
  
  // Obter os canais para a página atual
  const getCurrentPageChannels = () => {
    const start = currentPage * channelsPerPage;
    const end = start + channelsPerPage;
    return allChannels.slice(start, end);
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

  const handleChannelSelect = (channelId: string) => {
    console.log('Selecionando canal:', channelId);
    // Encontrar o canal completo nos dados carregados
    const selectedChannel = allChannels.find(channel => channel.id === channelId);
    
    if (selectedChannel) {
      console.log('Canal encontrado:', selectedChannel);
      updateFormData({
        selectedChannelId: channelId,
        selectedChannelData: {
          id: selectedChannel.id,
          channelName: selectedChannel.channelName,
          phoneNumber: selectedChannel.phoneNumber,
          operationalRegion: selectedChannel.operationalRegion,
        },
        step: 0
      });
    } else {
      console.log('Canal não encontrado na lista');
      updateFormData({ selectedChannelId: channelId, step: 0 });
    }
  };

  const handleNext = () => {
    if (selectedChannelId) {
      // Navegar para a próxima etapa (Selecionar Agente)
      navigate(`/dashboard/clinic/${clinicId}/messages/bulk/agent`);
    } else {
      toast({
        title: "Seleção necessária",
        description: "Por favor, selecione um canal WhatsApp para continuar",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    // Voltar para o dashboard
    navigate(`/dashboard/clinic/${clinicId}`);
  };

  const handleCreateChannel = () => {
    // Navegar para o fluxo de criação de canal
    navigate('/dashboard/channels/create/type', {
      state: { 
        from: '/dashboard/messages/bulk/channel'
      }
    });
  };

  // Verificar se pode prosseguir
  const canProceed = Boolean(selectedChannelId);
  
  // Debug
  console.log('Estado do botão:', {
    selectedChannelId,
    canProceed,
    loadingChannels,
    disabled: !canProceed || loadingChannels
  });

  // Obter canais da página atual
  const currentChannels = getCurrentPageChannels();

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
            currentStep={0} 
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-medium text-gray-800">Selecionar Canal</h2>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-1">Etapa 1: Escolha o canal WhatsApp que será utilizado</p>
      </div>

      {/* Cards de canais */}
      <div className="mb-2">
        {loadingChannels ? (
          // Estado de carregamento
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse space-y-4">
              <div className="flex space-x-10">
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
              </div>
              <p className="text-center text-gray-500">Carregando canais...</p>
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
        ) : allChannels.length === 0 ? (
          // Caso especial: quando não há canais, mostrar apenas o card de criar
          <div className="overflow-x-auto overflow-y-hidden py-1">
            <div className="flex gap-5 min-w-max px-1 py-1">
              <AddChannelCard onClick={handleCreateChannel} />
            </div>
          </div>
        ) : (
          // Canais existentes com card de criar no início
          <div className="overflow-x-auto overflow-y-hidden py-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
            <div className="flex gap-5 min-w-max px-1 py-1">
              {/* Card para criar novo canal - sempre no início */}
              <AddChannelCard onClick={handleCreateChannel} />
              
              {currentChannels.map((channel) => (
                <SelectableChannelCard
                  key={channel.id}
                  channel={channel}
                  selected={selectedChannelId === channel.id}
                  onClick={() => handleChannelSelect(channel.id)}
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
            (!canProceed || loadingChannels) 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:shadow-lg'
          }`}
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)'
          }}
          disabled={!canProceed || loadingChannels}
        >
          Próximo
        </button>
      </div>
    </div>
  );
} 