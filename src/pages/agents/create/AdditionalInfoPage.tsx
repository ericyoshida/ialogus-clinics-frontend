import { MultiStepAgent } from '@/components/multi-step-agent'
import { Textarea } from '@/components/ui/textarea'
import { useClinics } from '@/hooks/use-clinics'
import { cn } from '@/lib/utils'
import { agentsService } from '@/services/agents'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'


// Componente de TextArea personalizado com o estilo Ialogus
function IalogusTextarea({
  label,
  errorMessage,
  value,
  onChange,
  className,
  ...props
}: {
  label?: string;
  errorMessage?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));

  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <div className="w-full">
      <div className={cn(
        "relative rounded-md overflow-hidden transition-colors",
        isFocused ? "bg-orange-50" : "bg-white"
      )}>
        {/* Adicionar área com padding no topo para evitar que o texto toque o label */}
        <div 
          className={cn(
            "absolute left-0 right-0 top-0 h-6 z-10",
            isFocused ? "bg-orange-50" : "bg-white"
          )}
        />
        
        <Textarea
          className={cn(
            'border-0 focus:ring-0 min-h-[120px] rounded-md outline-none focus:outline-none resize-y px-3 w-full relative z-0',
            (isFocused || hasValue) ? 'pt-7 pb-2' : 'py-3',
            errorMessage && 'border-red-500',
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChange={onChange}
          placeholder=""
          style={{ backgroundColor: 'transparent' }}
          {...props}
        />
        
        {label && (
          <label 
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none z-20",
              isFocused 
                ? "text-xs font-medium top-2" 
                : hasValue
                  ? "text-xs font-medium top-2 text-gray-600"
                  : "text-base text-gray-500 top-3"
            )}
            style={{
              color: isFocused ? '#F6921E' : undefined
            }}
          >
            {label}
          </label>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden z-20">
          <div 
            className={cn(
              'w-full transition-all duration-200', 
              isFocused 
                ? 'h-1' 
                : 'h-0.5'
            )}
            style={{
              background: isFocused 
                ? 'linear-gradient(90deg, #F6921E 14%, #EE413D 45%, #E63F42 50%, #D33952 57%, #B2306D 66%, #852492 76%, #4B14C1 87%, #0501FA 99%, #0000FF 100%)' 
                : 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
            }}
          />
        </div>
      </div>
      
      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

export default function AdditionalInfoPage() {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  
  // Buscar nome da clínica
  const { clinics } = useClinics();
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...';
  
  // Estado para armazenar as informações adicionais
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Validar se temos um clinicId
  useEffect(() => {
    if (!clinicId) {
      navigate('/dashboard');
      return;
    }
  }, [clinicId, navigate]);
  
  // Carregar dados salvos no localStorage se disponíveis
  useEffect(() => {
    const savedInfo = localStorage.getItem('temp_agent_additional_info');
    if (savedInfo) {
      setAdditionalInfo(savedInfo);
    }
  }, []);
  
  // Salvar informações no localStorage quando forem alteradas
  useEffect(() => {
    if (additionalInfo.trim()) {
      localStorage.setItem('temp_agent_additional_info', additionalInfo);
    }
  }, [additionalInfo]);
  
  // Função para voltar à etapa anterior
  const handleBack = () => {
    navigate(`/dashboard/clinic/${clinicId}/agents/create/product-catalog`);
  };
  
  // Função para finalizar a criação do agente
  const handleFinalize = async () => {
    try {
      setIsCreating(true);

      // Recuperar todos os dados salvos no localStorage
      const agentName = localStorage.getItem('temp_agent_name') || '';
      const productsListId = localStorage.getItem('selected_catalog') || '';

      // Validar dados obrigatórios
      if (!agentName) {
        toast.error('Nome do agente não foi definido');
        setIsCreating(false);
        return;
      }

      if (!productsListId) {
        toast.error('Catálogo de produtos não foi selecionado');
        setIsCreating(false);
        return;
      }

      // Texto padrão para humanChatConditions cobrindo os 3 casos:
      // 1. Solicitação de operador humano
      // 2. Cliente impaciente
      // 3. Cliente bravo com o atendimento
      const humanChatConditions =
        'Quando o cliente solicitar explicitamente falar com um atendente humano, ou quando demonstrar impaciência ou insatisfação com o atendimento.';

      console.log('Criando agente com os dados:', {
        clinicId,
        agentName,
        additionalInstructions: additionalInfo,
        humanChatConditions,
        productsListId,
      });

      // Chamar a API para criar o agente
      await agentsService.createBotModel(clinicId!, {
        agentName,
        additionalInstructions: additionalInfo || '',
        humanChatConditions,
        productsListId,
      });

      toast.success('Agente criado com sucesso!');

      // Limpar TODOS os dados temporários do localStorage
      localStorage.removeItem('temp_agent_additional_info');
      localStorage.removeItem('temp_selected_products');
      localStorage.removeItem('temp_catalog_products');
      localStorage.removeItem('temp_catalog_name');
      localStorage.removeItem('selected_catalog');
      localStorage.removeItem('catalog_saved');
      localStorage.removeItem('temp_product_data');
      localStorage.removeItem('temp_agent_name');
      localStorage.removeItem('temp_selected_clinic');

      // Navegar para a página de sucesso
      navigate(`/dashboard/clinic/${clinicId}/agents/create/success`);
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      toast.error('Erro ao criar agente. Tente novamente.');
      setIsCreating(false);
    }
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
        <p className="text-gray-500 text-sm mb-4">Etapa 3: Adicione informações complementares</p>

        {/* Indicador de multistep abaixo do título */}
        <div className="w-full mb-6">
          <MultiStepAgent
            currentStep={3}
            totalSteps={3}
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-medium text-gray-800">Informações Adicionais ao Agente</h2>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-6">Adicione informações complementares para personalizar o comportamento e conhecimento do seu agente</p>
      </div>
      
      {/* Formulário */}
      <div className="max-w-3xl">
        <div className="space-y-6">
          {/* Campo de Informações Adicionais com Textarea */}
          <div className="space-y-1">
            <IalogusTextarea
              label="Informações Adicionais"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full bg-white focus:bg-orange-50 min-h-[200px]"
            />
            <p className="text-xs text-gray-500 mt-2">
              Adicione aqui regras de negócio, modo de falar do agente, informações adicionais do negócio, 
              instruções específicas sobre como o agente deve abordar determinados assuntos, 
              restrições de venda, políticas da clínica ou qualquer outra orientação relevante.
              Estas informações serão utilizadas para personalizar o comportamento do seu agente.
            </p>
          </div>
        </div>
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
          onClick={handleFinalize}
          disabled={isCreating}
          className="px-5 py-2 rounded-md text-white transition-colors disabled:opacity-50"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)'
          }}
        >
          {isCreating ? 'Criando...' : 'Finalizar Criação'}
        </button>
      </div>
    </div>
  );
} 