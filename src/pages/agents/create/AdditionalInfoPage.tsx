import { MultiStepAgent } from '@/components/multi-step-agent'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCompanies } from '@/hooks/use-companies'
import { agentsService } from '@/services/agents'
import { departmentsService } from '@/services/departments'
import { ApiService } from '@/services/api'
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
  const { companyId } = useParams<{ companyId: string }>();
  
  // Buscar nome da empresa
  const { companies } = useCompanies();
  const companyName = companies.find(c => c.id === companyId)?.name || 'Carregando...';
  
  // Estado para armazenar as informações adicionais
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Validar se temos um companyId
  useEffect(() => {
    if (!companyId) {
      navigate('/dashboard');
      return;
    }
  }, [companyId, navigate]);
  
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
    navigate(`/dashboard/company/${companyId}/agents/create/product-catalog`);
  };
  
  // Função para finalizar a criação do agente
  const handleFinalize = async () => {
    try {
      setIsCreating(true);
      
      // Recuperar todos os dados salvos no localStorage
      const botName = localStorage.getItem('temp_agent_name') || '';
      const conversationFlowId = localStorage.getItem('temp_conversation_flow') || '';
      const conversationFlowName = localStorage.getItem('temp_conversation_flow_name') || 'Fluxo';
      const productsListId = localStorage.getItem('selected_catalog') || '';
      const humanChatConditions = localStorage.getItem('temp_human_chat_conditions') || 'Quando o cliente solicitar falar com um atendente humano';
      const agentType = localStorage.getItem('temp_agent_type') || 'sales';
      
      // Validar dados obrigatórios
      if (!botName) {
        toast.error('Nome do agente não foi definido');
        setIsCreating(false);
        return;
      }
      
      if (!conversationFlowId) {
        toast.error('Fluxo de conversa não foi selecionado');
        setIsCreating(false);
        return;
      }
      
      if (!productsListId) {
        toast.error('Catálogo de produtos não foi selecionado');
        setIsCreating(false);
        return;
      }
      
      // Definir o macro departamento baseado no tipo de agente (deve ser 'sales' ou 'customer_services')
      const macroDepartmentName = agentType === 'sales' ? 'sales' : 'customer_services';
      
      // Criar nome do departamento concatenando macro department + flowchart name
      const macroDepartmentDisplayName = agentType === 'sales' ? 'Vendas' : 'Suporte';
      const departmentName = `${macroDepartmentDisplayName} - ${conversationFlowName}`;
      
      console.log('Criando departamento:', {
        clinicId: companyId,
        departmentName,
        macroDepartmentName
      });
      
      // Primeiro criar o departamento
      const department = await departmentsService.createDepartment(companyId!, {
        departmentName,
        macroDepartmentName
      });
      
      console.log('Departamento criado - resposta completa:', department);
      console.log('Estrutura do departamento:', Object.keys(department));
      
      // Usar o ID do departamento criado
      // A resposta pode vir como { department: { id: ... } } ou diretamente como { id: ... }
      const departmentData = department.department || department;
      console.log('Department data:', departmentData);
      console.log('Keys do departmentData:', Object.keys(departmentData));
      
      // Extrair o ID do departamento
      let departmentId = departmentData.id || departmentData.departmentId || departmentData._id;
      
      // Se o ID for um objeto com propriedade value, extrair o value
      if (departmentId && typeof departmentId === 'object' && 'value' in departmentId) {
        departmentId = departmentId.value;
      }
      
      console.log('Department ID extraído:', departmentId);
      
      if (!departmentId) {
        throw new Error('ID do departamento não encontrado na resposta');
      }
      
      // Criar messagesFlowchart se necessário
      let messagesFlowchartId = conversationFlowId;
      
      // Se o conversationFlowId for um tipo de template, criar o flowchart a partir do template
      if (conversationFlowId === 'sales_general' || conversationFlowId === 'sales_scheduling') {
        console.log('Criando flowchart a partir do template:', conversationFlowId);
        
        const flowchartResult = await ApiService.createFlowchartFromTemplate(companyId!, {
          templateType: conversationFlowId as 'sales_general' | 'sales_scheduling',
          name: conversationFlowName
        });
        
        messagesFlowchartId = flowchartResult.messagesFlowchart.id;
        console.log('Flowchart criado:', messagesFlowchartId);
      }
      
      console.log('Criando agente com os dados:', {
        departmentId,
        botName,
        additionalInstructions: additionalInfo,
        humanChatConditions,
        productsListId,
        messagesFlowchartId
      });
      
      // Chamar a API para criar o bot model
      await agentsService.createBotModel(departmentId, {
        botName,
        additionalInstructions: additionalInfo || '',
        humanChatConditions,
        productsListId,
        messagesFlowchartId
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
      localStorage.removeItem('temp_agent_type');
      localStorage.removeItem('temp_conversation_flow');
      localStorage.removeItem('temp_conversation_flow_name');
      localStorage.removeItem('temp_selected_company');
      localStorage.removeItem('temp_human_chat_conditions');
      
      // Navegar para a página de sucesso
      navigate(`/dashboard/company/${companyId}/agents/create/success`);
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
          <span className="text-gray-600">{companyName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Etapa 4: Adicione informações complementares</p>
        
        {/* Indicador de multistep abaixo do título */}
        <div className="w-full mb-6">
          <MultiStepAgent 
            currentStep={4} 
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
              restrições de venda, políticas da empresa ou qualquer outra orientação relevante.
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