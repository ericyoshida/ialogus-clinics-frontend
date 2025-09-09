import { FeatureCard } from '@/components/ui/feature-card'
import { MultiStepAgent } from '@/components/multi-step-agent'
import { useCompanies } from '@/hooks/use-companies'
import { useToast } from '@/hooks/use-toast'
import { Edit2, Loader2, MoreVertical, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { deleteCompany } from '../../../services/companies'


// Card de empresa com indicação visual de seleção
function CompanyCard({ 
  company, 
  selected, 
  onClick,
  onEdit,
  onDelete
}: { 
  company: { 
    id: string;
    name: string;
    svgPath?: string;
    description?: string;
  };
  selected: boolean;
  onClick: () => void;
  onEdit?: (companyId: string) => void;
  onDelete?: (companyId: string) => void;
}) {
  // Reference to manually trigger hover events on the card element
  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [forceHover, setForceHover] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  
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
  
  // Gerar cores de gradiente com base no ID da empresa
  const getGradientColors = (id: string) => {
    const gradients = [
      { from: '#F6921E', to: '#EE413D' },
      { from: '#4F46E5', to: '#8B5CF6' },
      { from: '#10B981', to: '#059669' },
      { from: '#F97316', to: '#C2410C' },
      { from: '#8B5CF6', to: '#6D28D9' }
    ];
    
    // Usar a soma dos caracteres do ID para determinar o índice
    const idSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[idSum % gradients.length];
  };

  const gradientColors = getGradientColors(company.id);
  
  // Função para obter o caminho do SVG baseado no índice da empresa
  const getSvgPath = () => {
    const fallbackSvgPath = `/images/ialogus-company-${Math.floor(Math.random() * 3) + 1}.svg`;
    return company.svgPath || fallbackSvgPath;
  };
  
  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      {selected && (
        <div className="absolute -top-5 left-3 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white">
          Selecionado
        </div>
      )}
      
      {/* Dropdown menu for edit/delete options */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 z-40">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-1 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            
            {showDropdown && (
              <div ref={dropdownRef} className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      onEdit(company.id);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 mr-2" />
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      onDelete(company.id);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Deletar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div ref={cardRef} className="w-full h-full">
        <FeatureCard
          title={company.name}
          decorativeElement="svg"
          svgPath={getSvgPath()}
          svgStyle={customSvgStyle}
          gradientColors={gradientColors}
          onClick={onClick}
          className={`h-full w-full aspect-square ${selected ? `ring-2 ring-offset-2 ring-[${gradientColors.from}]` : ''}`}
        />
      </div>
      {selected && (
        <div 
          className="absolute inset-0 z-5 rounded-lg pointer-events-none"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0) 20%, ${gradientColors.from} 100%)`,
            opacity: 0.25,
          }}
        />
      )}
    </div>
  );
}

// Delete Confirmation Dialog Component
function DeleteConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  companyName,
  isDeleting
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  companyName: string;
  isDeleting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Confirmar exclusão
        </h3>
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja deletar a empresa <strong>{companyName}</strong>? 
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeleting ? 'Deletando...' : 'Deletar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectCompanyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Usar o hook useCompanies para obter as empresas do usuário
  const { companies: apiCompanies, loading, error, refetchCompanies } = useCompanies();
  
  // Estado para controlar o redirecionamento automático
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Estado para a empresa selecionada
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  // Estado para mensagem de alerta
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  // Flag para controlar se a primeira inicialização já foi feita
  const initialLoadDone = useRef(false);
  // Flag para controlar se a seleção veio do usuário ou do efeito automático
  const userInitiatedSelection = useRef(false);
  
  // Estados para edição e exclusão de empresas
  const [companyToDelete, setCompanyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Função para extrair o ID da empresa da URL da página anterior
  const extractCompanyIdFromPath = () => {
    const { state } = location;
    
    // Verificar se veio da navegação com state
    if (state) {
      // Verificar primeiro se há um companyId explícito no state
      if (state.companyId) {
        console.log(`Detectado companyId explícito no state: ${state.companyId}`);
        return state.companyId;
      }
      
      // Se não houver companyId explícito, verificar o caminho anterior
      if (state.from) {
        const fromPath = state.from as string;
        
        // Verificar se veio da tela de listagem de agentes de uma empresa
        const agentsListMatch = fromPath.match(/\/company\/([^/]+)\/agents/);
        if (agentsListMatch && agentsListMatch[1]) {
          console.log(`Detectado navegação da tela de agentes da empresa: ${agentsListMatch[1]}`);
          return agentsListMatch[1];
        }
        
        // Verificar se veio de qualquer página de empresa
        const companyMatch = fromPath.match(/\/company\/([^/]+)/);
        if (companyMatch && companyMatch[1]) {
          console.log(`Detectado navegação de página da empresa: ${companyMatch[1]}`);
          return companyMatch[1];
        }
      }
    }
    
    // Verificar a URL atual
    const pathname = location.pathname;
    
    // Verificar se a URL atual contém referência à página de agentes de uma empresa
    const currentAgentsMatch = pathname.match(/\/company\/([^/]+)\/agents\/create/);
    if (currentAgentsMatch && currentAgentsMatch[1]) {
      console.log(`Detectado URL atual com referência à empresa: ${currentAgentsMatch[1]}`);
      return currentAgentsMatch[1];
    }
    
    // Verificar se há um parâmetro companyId na URL atual
    const searchParams = new URLSearchParams(location.search);
    const companyIdParam = searchParams.get('companyId');
    if (companyIdParam) {
      console.log(`Detectado parâmetro companyId na URL: ${companyIdParam}`);
      return companyIdParam;
    }
    
    return null;
  };
  
  // Efeito para verificar se precisamos redirecionar imediatamente antes de qualquer renderização
  useEffect(() => {
    // Se ainda estamos carregando dados ou já iniciamos o redirecionamento, não fazer nada
    if (loading || isRedirecting) return;
    
    // Extrair o ID da empresa
    const companyIdFromPath = extractCompanyIdFromPath();
    
    // Verificar se o ID existe e se a empresa é válida
    if (companyIdFromPath) {
      const companyExists = apiCompanies.some(company => company.id === companyIdFromPath);
      
      if (companyExists) {
        // Verificar se veio diretamente da página de agentes
        const { state } = location;
        const fromPath = state?.from as string || '';
        const isFromAgentsList = fromPath.match(/\/company\/([^/]+)\/agents/) !== null;
        const hasExplicitCompanyId = state?.companyId !== undefined;

        // Se vier da lista de agentes ou tiver um ID explícito, redirecionar imediatamente
        if (isFromAgentsList || hasExplicitCompanyId) {
          // Encontrar a empresa para mostrar nome no toast
          const selectedCompanyData = apiCompanies.find(company => company.id === companyIdFromPath);
          const selectedCompanyName = selectedCompanyData?.name || 'Empresa';
          
          // Marcar como redirecionando para evitar renderizações desnecessárias
          setIsRedirecting(true);
          
          // Salvar no localStorage e marcar inicialização concluída
          localStorage.setItem('temp_selected_company', companyIdFromPath);
          initialLoadDone.current = true;
          
          // Mostrar toast
          toast({
            title: "Criando novo agente",
            description: `Configurando novo agente para ${selectedCompanyName}`,
          });
          
          // Redirecionar imediatamente
          navigate('/dashboard/agents/create/agent-type', { replace: true });
          return;
        }
      }
    }
  }, [apiCompanies, loading, navigate, toast, location]);
  
  // Efeito para pré-selecionar a empresa se não estiver redirecionando automaticamente
  useEffect(() => {
    // Pular se estamos redirecionando ou já inicializamos
    if (isRedirecting || initialLoadDone.current || loading) return;
    
    // Extrair o ID da empresa
    const companyIdFromPath = extractCompanyIdFromPath();
    
    if (companyIdFromPath) {
      // Verificar se a empresa existe
      const companyExists = apiCompanies.some(company => company.id === companyIdFromPath);
      
      if (companyExists) {
        // Pré-selecionar a empresa
        setSelectedCompany(companyIdFromPath);
        // Também salvar no localStorage
        localStorage.setItem('temp_selected_company', companyIdFromPath);
      } else {
        // Mostrar mensagem de alerta se a empresa não existir
        setAlertMessage(`A empresa com ID ${companyIdFromPath} não foi encontrada na lista. Por favor, selecione uma empresa.`);
      }
    } else {
      // Se não houver ID na URL, tentar carregar do localStorage
      const savedCompany = localStorage.getItem('temp_selected_company');
      if (savedCompany) {
        // Verificar se a empresa salva existe na lista
        const companyExists = apiCompanies.some(company => company.id === savedCompany);
        
        if (companyExists) {
          setSelectedCompany(savedCompany);
        } else {
          localStorage.removeItem('temp_selected_company');
        }
      }
    }
    
    // Marcar inicialização como concluída
    initialLoadDone.current = true;
  }, [apiCompanies, loading, isRedirecting]);
  
  // Salvar empresa selecionada no localStorage quando mudar (se foi selecionada pelo usuário)
  useEffect(() => {
    // Só salvar se a seleção foi iniciada pelo usuário
    if (userInitiatedSelection.current && selectedCompany !== null) {
      localStorage.setItem('temp_selected_company', selectedCompany);
    }
    
    // Resetar a flag de seleção iniciada pelo usuário
    userInitiatedSelection.current = false;
  }, [selectedCompany]);
  
  // Se estamos redirecionando, mostrar apenas um indicador simples
  if (isRedirecting) {
    return null; // Não mostrar nada durante o redirecionamento
  }
  
  // Função para selecionar uma empresa
  const handleCompanySelect = (companyId: string) => {
    // Indicar que esta seleção foi iniciada pelo usuário
    userInitiatedSelection.current = true;
    setSelectedCompany(companyId);
    setAlertMessage(null); // Limpar mensagem de alerta quando o usuário selecionar uma empresa
  };
  
  // Função para lidar com a adição de uma nova empresa
  const handleAddCompany = () => {
    console.log('Adicionar nova empresa');
    // Navegar para a página de criação de empresa
    navigate('/dashboard/company/create', { 
      state: { from: '/dashboard/agents/create/company' } 
    });
  };

  // Função para avançar para a próxima etapa
  const handleNext = () => {
    if (selectedCompany !== null) {
      // Encontrar o nome da empresa para exibir no toast
      const selectedCompanyName = apiCompanies.find(company => company.id === selectedCompany)?.name || 'Empresa';
      
      // Mostrar toast de sucesso
      toast({
        title: "Empresa selecionada",
        description: `${selectedCompanyName} foi selecionada para seu agente.`,
      });
      
      // Navegar para a próxima etapa
      navigate('/dashboard/agents/create/agent-type');
    } else {
      // Exibir alguma mensagem ou feedback de que é necessário selecionar uma empresa
      setAlertMessage('Por favor, selecione uma empresa para continuar');
    }
  };

  // Função para cancelar e voltar para a lista de agentes
  const handleCancel = () => {
    // Determinar para qual empresa voltar
    let companyIdToReturn: string | null = null;
    
    // Primeiro verificar se há uma empresa já selecionada
    if (selectedCompany !== null) {
      companyIdToReturn = selectedCompany;
    } else {
      // Se não há empresa selecionada, verificar se há um parâmetro na URL
      const companyIdParam = extractCompanyIdFromPath();
      if (companyIdParam) {
        companyIdToReturn = companyIdParam;
      }
    }
    
    // Limpar dados temporários do localStorage
    localStorage.removeItem('temp_selected_company');
    
    // Verificar se deve voltar para a página de uma empresa específica
    if (companyIdToReturn !== null) {
      const companyData = apiCompanies.find(c => c.id === companyIdToReturn);
      if (companyData) {
        // Navegar para a página de agentes da empresa específica
        navigate(`/dashboard/company/${companyIdToReturn}/agents`);
        return;
      }
    }
    
    // Fallback: se não encontrou nenhuma empresa, voltar para o dashboard
    navigate('/dashboard');
  };

  // Função para editar empresa
  const handleEditCompany = (companyId: string) => {
    const company = apiCompanies.find(c => c.id === companyId);
    if (company) {
      // Salvar dados da empresa no localStorage para edição
      const companyData = {
        name: company.name,
        shortName: company.shortName || '',
        brandDescription: company.brandDescription,
        businessDescription: company.businessDescription
      };
      localStorage.setItem('temp_edit_company', JSON.stringify({
        id: companyId,
        ...companyData
      }));
      
      // Navegar para a página de edição de empresa
      navigate(`/dashboard/agents/create/company/edit/${companyId}`, { 
        state: { 
          editMode: true, 
          companyId: companyId,
          companyData: companyData,
          from: '/dashboard/agents/create/company'
        } 
      });
    } else {
      toast({
        title: "Erro",
        description: "Empresa não encontrada",
        variant: "destructive"
      });
    }
  };

  // Função para deletar empresa
  const handleDeleteCompany = (companyId: string) => {
    const company = apiCompanies.find(c => c.id === companyId);
    if (company) {
      setCompanyToDelete({ id: companyId, name: company.name });
      setDeleteDialogOpen(true);
    }
  };

  // Confirmar exclusão da empresa
  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCompany(companyToDelete.id);
      
      toast({
        title: "Sucesso",
        description: `Empresa "${companyToDelete.name}" deletada com sucesso`,
      });

      // Atualizar lista de empresas
      await refetchCompanies();
      
      // Se a empresa deletada estava selecionada, limpar seleção
      if (selectedCompany === companyToDelete.id) {
        setSelectedCompany(null);
        localStorage.removeItem('temp_selected_company');
      }
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar empresa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  // Cancelar exclusão da empresa
  const cancelDeleteCompany = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  return (
    <div className="max-w-7xl h-[calc(100vh-80px)] flex flex-col -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-2">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2">
          Criar Novo Agente
        </h1>
        <p className="text-gray-500 text-sm mb-4">Etapa 1: Selecione a empresa para o agente</p>
        
        <div className="w-full mb-4">
          <MultiStepAgent 
            currentStep={1} 
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-medium text-gray-800">Escolha uma empresa para seu agente</h2>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-2">Selecione uma empresa existente ou crie uma nova para associar ao seu agente</p>
        
        {/* Mensagem de alerta */}
        {alertMessage && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {alertMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Mensagem de erro da API */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
                <button 
                  onClick={refetchCompanies}
                  className="text-sm mt-1 text-red-700 hover:text-red-800 underline cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cards de empresas */}
      <div className="flex-grow">
        {loading ? (
          // Estado de carregamento
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse space-y-4">
              <div className="flex space-x-10">
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
              </div>
              <p className="text-center text-gray-500">Carregando empresas...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden py-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
            <div className="flex gap-5 min-w-max px-1 py-4">
              {/* Card para adicionar nova empresa */}
              <button
                onClick={handleAddCompany}
                className="w-[250px] h-[250px] flex-shrink-0 bg-transparent border-none outline-none focus:outline-none p-0 m-0 mt-6 mb-6 cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:drop-shadow-[6px_6px_10px_rgba(0,0,0,0.15)]"
                aria-label="Adicionar nova empresa"
              >
                <img 
                  src="/images/add-company.svg" 
                  alt="Adicionar nova empresa" 
                  className="w-full h-full object-contain"
                />
              </button>
              
              {/* Cards de empresas existentes da API */}
              {apiCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={{
                    id: company.id,
                    name: company.name,
                    description: company.brandDescription || company.businessDescription,
                  }}
                  selected={selectedCompany === company.id}
                  onClick={() => handleCompanySelect(company.id)}
                  onEdit={handleEditCompany}
                  onDelete={handleDeleteCompany}
                />
              ))}
              
              {/* Mostrar mensagem se não houver empresas */}
              {!loading && apiCompanies.length === 0 && !error && (
                <div className="flex items-center justify-center h-[250px] w-full">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">Nenhuma empresa encontrada</p>
                    <p className="text-sm">Clique no botão "+" para adicionar uma nova empresa</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Botões de navegação */}
      <div className="flex mt-2">
        <button
          onClick={handleCancel}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          onClick={handleNext}
          className="px-5 py-2 rounded-md text-white transition-colors"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)',
            opacity: selectedCompany === null ? 0.7 : 1 
          }}
          disabled={selectedCompany === null || loading}
        >
          Próximo
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onConfirm={confirmDeleteCompany}
        onCancel={cancelDeleteCompany}
        companyName={companyToDelete?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
} 