import { FeatureCard } from '@/components/ui/feature-card';
import { MultiStepAgent } from '@/components/multi-step-agent';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/use-companies';
import { ApiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PencilIcon } from '@heroicons/react/24/outline';


// Card de adicionar novo fluxo
function AddFlowCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-[250px] h-[250px] bg-transparent border-none outline-none focus:outline-none p-0 m-0 cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:drop-shadow-[6px_6px_10px_rgba(0,0,0,0.15)]"
      aria-label="Adicionar novo fluxo"
    >
      <img 
        src="/images/add-conversation-flow.svg" 
        alt="Adicionar novo fluxo" 
        className="w-full h-full object-contain"
      />
    </button>
  );
}

// Card wrapper component that handles hover state
function ConversationFlowCard({ 
  flow, 
  selected, 
  onClick,
  onEdit,
  onDelete,
  onUseAsBase
}: { 
  flow: { 
    id: string;
    title: string;
    description: string;
    imagePath: string;
    gradientColors: { from: string; to: string; }
    isPrecreated?: boolean;
  };
  selected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUseAsBase?: () => void;
}) {
  // Reference to manually trigger hover events on the card element
  const cardRef = useRef<HTMLDivElement>(null);
  const [forceHover, setForceHover] = useState(false);
  
  // Apply hover effect when selected
  useEffect(() => {
    if (!cardRef.current) return;
    
    // If selected, dispatch a mouseenter event to trigger hover effect
    if (selected && !forceHover) {
      setForceHover(true);
      const enterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
      });
      cardRef.current.dispatchEvent(enterEvent);
    }
  }, [selected, forceHover]);
  
  // Definir estilos personalizados para o SVG
  const customSvgStyle = {
    bottom: '-18px',
    right: '-5px',
  };
  
  return (
    <div className="w-[250px] h-[250px] relative">
      {selected && (
        <div className="absolute -top-1 left-3 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white" style={{ transform: 'translateY(-50%)' }}>
          Selecionado
        </div>
      )}
      {flow.isPrecreated && (
        <div className="absolute -top-1 right-3 z-50 bg-blue-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white" style={{ transform: 'translateY(-50%)' }}>
          Pré-criado
        </div>
      )}
      <div ref={cardRef} className="w-full h-full">
        <FeatureCard
          title={flow.title}
          description={flow.description}
          decorativeElement="svg"
          svgPath={flow.imagePath}
          svgStyle={customSvgStyle}
          gradientColors={flow.gradientColors}
          onClick={onClick}
          className={`h-full w-full aspect-square ${selected ? `ring-2 ring-offset-2 ring-[${flow.gradientColors.from}]` : ''}`}
          showMenu={!flow.isPrecreated && (!!onEdit || !!onDelete)}
          onEdit={onEdit}
          onDelete={onDelete}
          editLabel="Editar Fluxo"
          deleteLabel="Deletar Fluxo"
        />
      </div>
      {selected && (
        <div 
          className="absolute inset-0 z-5 rounded-lg pointer-events-none"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0) 20%, ${flow.gradientColors.from} 100%)`,
            opacity: 0.25,
          }}
        />
      )}
      {/* Botão Usar como Base para templates */}
      {flow.isPrecreated && onUseAsBase && (
        <div className="absolute bottom-2 left-2 z-20">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation(); // Previne seleção do card
              onUseAsBase();
            }}
            className="h-7 px-2 text-xs bg-white/80 hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-200 border border-gray-200/50 hover:border-gray-300"
          >
            <PencilIcon className="w-3 h-3 mr-1" />
            Usar Base
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SelectConversationFlowPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  
  // Buscar nome da empresa
  const { companies } = useCompanies();
  const companyName = companies.find(c => c.id === companyId)?.name || 'Carregando...';
  
  // Estado para o fluxo de conversa selecionado
  const [conversationFlow, setConversationFlow] = useState<string | null>(null);
  const [userFlows, setUserFlows] = useState<Array<{
    id: string;
    title: string;
    description: string;
    imagePath: string;
    gradientColors: { from: string; to: string; }
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para o modal de criar from template
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{ type: string; name: string } | null>(null);
  const [newFlowName, setNewFlowName] = useState('');
  
  // Validar se temos um companyId
  useEffect(() => {
    if (!companyId) {
      navigate('/dashboard');
      return;
    }
  }, [companyId, navigate]);
  
  // Carregar dados salvos do localStorage quando o componente é montado
  useEffect(() => {
    const savedFlow = localStorage.getItem('temp_conversation_flow');
    if (savedFlow) {
      setConversationFlow(savedFlow);
    }
  }, []);
  
  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    if (conversationFlow) {
      localStorage.setItem('temp_conversation_flow', conversationFlow);
    }
  }, [conversationFlow]);
  
  // Função para usar template como base
  const handleUseAsBase = (templateType: string, templateName: string) => {
    setSelectedTemplate({ type: templateType, name: templateName });
    setNewFlowName('');
    setIsTemplateModalOpen(true);
  };
  
  // Função para criar flowchart a partir do template
  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !newFlowName.trim() || !companyId) return;
    
    try {
      const response = await ApiService.createFlowchartFromTemplate(
        companyId,
        {
          templateType: selectedTemplate.type as 'sales_general' | 'sales_scheduling',
          name: newFlowName.trim()
        }
      );
      
      // Navegar para o editor com o novo flowchart
      navigate(`/dashboard/company/${companyId}/conversations/flow-editor?flowchartId=${response.messagesFlowchart.id}`);
      
      toast({
        title: "Sucesso",
        description: "Fluxo criado a partir do template com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar flowchart do template:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar fluxo a partir do template",
        variant: "destructive",
      });
    } finally {
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
      setNewFlowName('');
    }
  };
  
  // Fluxos de conversa pré-criados
  const precreatedFlows = [
    {
      id: 'sales_general',
      title: 'Locação de Equipamentos',
      description: 'Otimizado para conduzir clientes no processo de locação, desde o interesse inicial até o fechamento.',
      imagePath: '/images/market-image.svg',
      gradientColors: { from: '#F97316', to: '#C2410C' },
      isPrecreated: true
    },
    {
      id: 'sales_scheduling',
      title: 'Vendas com Agendamento',
      description: 'Ideal para converter leads em vendas através de agendamento automatizado de reuniões e demonstrações.',
      imagePath: '/images/calendar-image.svg',
      gradientColors: { from: '#3B82F6', to: '#1E40AF' },
      isPrecreated: true
    }
  ];
  
  // Buscar fluxos do usuário da API
  useEffect(() => {
    async function fetchUserFlows() {
      if (!companyId) return;
      
      setIsLoading(true);
      try {
        const response = await ApiService.listMessagesFlowcharts(companyId);
        
        // Mapear os fluxos para o formato esperado
        const mappedFlows = response.messagesFlowcharts.map((flow, index) => ({
          id: flow.id,
          title: flow.name,
          description: `Fluxo personalizado criado em ${new Date(flow.createdAt).toLocaleDateString('pt-BR')}`,
          imagePath: '/images/conversation-flow-image.svg',
          gradientColors: {
            from: index % 2 === 0 ? '#8B5CF6' : '#10B981',
            to: index % 2 === 0 ? '#6D28D9' : '#059669'
          }
        }));
        
        setUserFlows(mappedFlows);
      } catch (error) {
        console.error('Erro ao buscar fluxos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar fluxos de conversa",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserFlows();
  }, [companyId, toast]);
  
  // Função para selecionar um fluxo de conversa
  const selectConversationFlow = (flowId: string) => {
    setConversationFlow(flowId);
  };
  
  // Função para adicionar um novo fluxo
  const handleAddNewFlow = () => {
    console.log('Adicionar novo fluxo de conversa');
    // Navegar para a página de criação de fluxo
    navigate(`/dashboard/company/${companyId}/conversations/flow-editor`);
  };
  
  // Função para avançar para a próxima etapa
  const handleNext = () => {
    if (!conversationFlow) {
      // Você pode mostrar um alerta ou mensagem aqui
      console.error('Por favor, selecione um fluxo de conversa');
      return;
    }
    
    // Aqui você armazenaria os dados selecionados (em contexto ou localStorage)
    console.log(`Fluxo selecionado: ${conversationFlow}`);
    
    // Navegar para a próxima etapa: catálogo de produtos
    navigate(`/dashboard/company/${companyId}/agents/create/product-catalog`);
  };
  
  // Função para voltar à etapa anterior
  const handleBack = () => {
    navigate(`/dashboard/company/${companyId}/agents/create/agent-type`);
  };
  
  // Função para editar fluxo
  const handleEditFlow = (flowId: string, flowName: string) => {
    // Navegar para a tela de edição passando o ID do fluxo
    navigate(`/dashboard/company/${companyId}/conversations/flow-editor?flowchartId=${flowId}`);
  };
  
  // Estado para controlar o diálogo de deletar
  const [deletingFlowId, setDeletingFlowId] = useState<string | null>(null);
  
  // Função para deletar fluxo
  const handleDeleteFlow = async () => {
    if (!deletingFlowId) return;
    
    try {
      await ApiService.deleteMessagesFlowchart(deletingFlowId);
      
      // Remover da lista de fluxos
      setUserFlows(prev => prev.filter(flow => flow.id !== deletingFlowId));
      
      // Se o fluxo deletado estava selecionado, desselecionar
      if (conversationFlow === deletingFlowId) {
        setConversationFlow(null);
      }
      
      toast({
        title: "Sucesso",
        description: "Fluxo deletado com sucesso!",
      });
      
      setDeletingFlowId(null);
    } catch (error) {
      console.error('Erro ao deletar fluxo:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar fluxo. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-2">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Criar Novo Agente
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{companyName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Etapa 2: Defina o fluxo de conversa</p>
        
        {/* Indicador de multistep abaixo do título */}
        <div className="w-full mb-6">
          <MultiStepAgent 
            currentStep={2} 
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-medium text-gray-800">Escolha um fluxo de conversa</h2>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-6">Selecione um fluxo predefinido ou crie um fluxo personalizado para seu agente</p>
      </div>
      
      {/* Cards de fluxo de conversa */}
      <div className="mb-8">
        {isLoading ? (
          <div className="w-full text-center py-8">
            <p className="text-gray-500">Carregando fluxos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden py-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
            <div className="flex gap-5 min-w-max px-1 pb-4 pt-2">
              {/* Card para adicionar novo fluxo */}
              <AddFlowCard onClick={handleAddNewFlow} />
              
              {/* Cards dos fluxos pré-criados */}
              {precreatedFlows.map((flow) => (
                <ConversationFlowCard
                  key={flow.id}
                  flow={flow}
                  selected={conversationFlow === flow.id}
                  onClick={() => selectConversationFlow(flow.id, flow.title)}
                  onUseAsBase={() => handleUseAsBase(flow.id, flow.title)}
                />
              ))}
              
              {/* Separador visual se houver fluxos do usuário */}
              {userFlows.length > 0 && (
                <div className="flex items-center px-4">
                  <div className="h-48 w-px bg-gray-300"></div>
                </div>
              )}
              
              {/* Fluxos criados pelo usuário */}
              {userFlows.map((flow) => (
                <ConversationFlowCard
                  key={flow.id}
                  flow={flow}
                  selected={conversationFlow === flow.id}
                  onClick={() => selectConversationFlow(flow.id, flow.title)}
                  onEdit={() => handleEditFlow(flow.id, flow.title)}
                  onDelete={() => setDeletingFlowId(flow.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Botões de navegação */}
      <div className="flex mt-10">
        <button
          onClick={handleBack}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          onClick={handleNext}
          className="px-5 py-2 rounded-md text-white transition-colors"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)',
            opacity: !conversationFlow ? 0.7 : 1 
          }}
          disabled={!conversationFlow}
        >
          Próximo
        </button>
      </div>
      
      {/* Modal de confirmação para deletar */}
      <AlertDialog open={!!deletingFlowId} onOpenChange={(open) => {
        if (!open) {
          setDeletingFlowId(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente este fluxo de conversa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingFlowId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFlow}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal para criar flowchart a partir de template */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Fluxo a partir do Template</DialogTitle>
            <DialogDescription>
              Você está criando um novo fluxo baseado no template "{selectedTemplate?.name}".
              Digite um nome para o seu novo fluxo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Nome do Fluxo</Label>
              <Input
                id="flow-name"
                placeholder="Ex: Meu Fluxo de Vendas"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFlowName.trim()) {
                    handleCreateFromTemplate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTemplateModalOpen(false);
                setSelectedTemplate(null);
                setNewFlowName('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateFromTemplate}
              disabled={!newFlowName.trim()}
            >
              Criar Fluxo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 