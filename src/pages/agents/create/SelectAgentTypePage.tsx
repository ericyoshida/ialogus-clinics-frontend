import { MultiStepAgent } from '@/components/multi-step-agent'
import { FeatureCard } from '@/components/ui/feature-card'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { useClinics } from '@/hooks/use-clinics'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'


// Card wrapper component that handles hover state
function AgentTypeCard({ 
  type, 
  selected, 
  onClick 
}: { 
  type: { 
    id: string;
    title: string;
    description: string;
    imagePath: string;
    gradientColors: { from: string; to: string; }
  };
  selected: boolean;
  onClick: () => void;
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
      <div ref={cardRef} className="w-full h-full">
        <FeatureCard
          title={type.title}
          description={type.description}
          decorativeElement="svg"
          svgPath={type.imagePath}
          svgStyle={customSvgStyle}
          gradientColors={type.gradientColors}
          onClick={onClick}
          className={`h-full w-full aspect-square ${selected ? `ring-2 ring-offset-2 ring-[${type.gradientColors.from}]` : ''}`}
        />
      </div>
      {selected && (
        <div 
          className="absolute inset-0 z-5 rounded-lg pointer-events-none"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0) 20%, ${type.gradientColors.from} 100%)`,
            opacity: 0.25,
          }}
        />
      )}
    </div>
  );
}

export default function SelectAgentTypePage() {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  
  // Estado para os dados do agente
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState<'sales' | 'support' | null>(null);
  const [nameError, setNameError] = useState('');
  
  // Buscar nome da clínica
  const { clinics } = useClinics();
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...';
  
  // Validar se temos um clinicId
  useEffect(() => {
    if (!clinicId) {
      navigate('/dashboard');
      return;
    }
    
    // Salvar clinicId no localStorage para o fluxo
    localStorage.setItem('temp_selected_clinic', clinicId);
  }, [clinicId, navigate]);
  
  // Carregar dados salvos do localStorage quando o componente é montado
  useEffect(() => {
    const savedAgentName = localStorage.getItem('temp_agent_name');
    if (savedAgentName) {
      setAgentName(savedAgentName);
    }
    
    const savedAgentType = localStorage.getItem('temp_agent_type') as 'sales' | 'support' | null;
    if (savedAgentType) {
      setAgentType(savedAgentType);
    }
  }, []);
  
  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    if (agentName) {
      localStorage.setItem('temp_agent_name', agentName);
    }
    
    if (agentType) {
      localStorage.setItem('temp_agent_type', agentType);
    }
  }, [agentName, agentType]);
  
  // Tipos de agente disponíveis
  const agentTypes = [
    {
      id: 'sales',
      title: 'Vendas',
      description: 'Crie um agente especializado em vender produtos, gerar leads e converter clientes interessados em seu negócio.',
      imagePath: '/images/sales-image.svg',
      gradientColors: { from: '#F6921E', to: '#EE413D' }
    },
    {
      id: 'support',
      title: 'Suporte ao Cliente',
      description: 'Crie um agente para auxiliar seus clientes, responder perguntas frequentes e resolver problemas de atendimento.',
      imagePath: '/images/customer-service-image.svg',
      gradientColors: { from: '#4F46E5', to: '#8B5CF6' }
    }
  ];
  
  // Função para selecionar um tipo de agente
  const selectAgentType = (type: 'sales' | 'support') => {
    setAgentType(type);
  };
  
  // Função para avançar para a próxima etapa
  const handleNext = () => {
    // Validar nome do agente
    if (!agentName.trim()) {
      setNameError('O nome do agente é obrigatório');
      return;
    }
    
    // Validar tipo selecionado
    if (!agentType) {
      // Você pode mostrar um alerta ou mensagem aqui
      console.error('Por favor, selecione um tipo de agente');
      return;
    }
    
    // Aqui você armazenaria os dados selecionados (em contexto ou localStorage)
    console.log(`Agente: ${agentName}, Tipo: ${agentType}`);
    
    // Navegar para a próxima etapa
    navigate(`/dashboard/clinic/${clinicId}/agents/create/conversation-flow`);
  };
  
  // Função para voltar à etapa anterior
  const handleBack = () => {
    navigate(`/dashboard/clinic/${clinicId}/agents`);
  };
  
  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-2">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Criar Novo Agente
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{clinicName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Etapa 1: Defina o tipo do agente</p>
        
        {/* Indicador de multistep abaixo do título */}
        <div className="w-full mb-6">
          <MultiStepAgent 
            currentStep={1} 
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-medium text-gray-800">Escolha o tipo do seu agente</h2>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-6">Selecione o tipo de agente mais adequado para sua necessidade</p>
      </div>
      
      {/* Formulário */}
      <div className="max-w-full mx-0">
        {/* Campo de nome do agente */}
        <div className="mb-6">
          <div className="w-full md:w-[520px] overflow-hidden rounded-md">
            <IalogusInput
              label="Nome do Agente"
              value={agentName}
              onChange={(e) => {
                setAgentName(e.target.value);
                if (e.target.value.trim()) setNameError('');
              }}
              errorMessage={nameError}
              className="w-full bg-white focus:bg-orange-50"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Este será o nome que aparecerá para os clientes nas conversas
          </p>
        </div>
        
        {/* Cards de tipos de agente */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-3 md:gap-[20px]">
            {agentTypes.map((type) => (
              <AgentTypeCard
                key={type.id}
                type={type}
                selected={agentType === type.id}
                onClick={() => selectAgentType(type.id as 'sales' | 'support')}
              />
            ))}
          </div>
        </div>
        
        {/* Botões de navegação */}
        <div className="flex justify-between mt-10 max-w-[520px]">
          <button
            onClick={handleBack}
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          
          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-md text-white transition-colors"
            style={{ 
              background: 'linear-gradient(90deg, #F6921E, #EE413D)',
              opacity: (!agentName.trim() || !agentType) ? 0.7 : 1 
            }}
            disabled={!agentName.trim() || !agentType}
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
} 