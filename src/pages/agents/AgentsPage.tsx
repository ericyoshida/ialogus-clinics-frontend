import { AddAgentCard } from '@/components/agents/AddAgentCard'
import { AgentCard } from '@/components/agents/AgentCard'
import { useAgents } from '@/hooks/use-agents'
import { useCompanies } from '@/hooks/use-companies'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function AgentsPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<{
    name: string;
    id: string | undefined;
  }>({
    name: "Carregando...",
    id: companyId
  });
  
  // Buscar as empresas para encontrar o nome da empresa pelo ID
  const { companies, loading: loadingCompanies } = useCompanies();
  
  // Usar o hook de agentes
  const { agents, loading: loadingAgents, error, refetchAgents } = useAgents(company.id);
  
  // Atualizar o nome da empresa quando as empresas forem carregadas
  useEffect(() => {
    if (!loadingCompanies && companies.length > 0 && companyId) {
      const foundCompany = companies.find(c => c.id === companyId);
      
      if (foundCompany) {
        setCompany({
          name: foundCompany.name,
          id: companyId
        });
      } else {
        // Se não encontrou a empresa, mas temos o ID
        setCompany({
          name: "Empresa não encontrada",
          id: companyId
        });
      }
    }
  }, [companyId, companies, loadingCompanies]);
  
  // Estado para controlar a paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Número fixo de agentes por página
  const agentsPerPage = 6; // Mantendo fixo em 6 agentes por página

  // State para armazenar o número de colunas baseado no tamanho da tela
  const [columns, setColumns] = useState(4); // Padrão para 4 colunas máximas

  // Efeito para atualizar o número de colunas quando a tela mudar de tamanho
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumns(1); // Mobile: 1 coluna
      } else if (window.innerWidth < 1024) {
        setColumns(2); // Tablet: 2 colunas
      } else if (window.innerWidth < 1440) {
        setColumns(3); // Desktop menor: 3 colunas
      } else {
        setColumns(4); // Desktop maior: 4 colunas
      }
    };

    // Inicializar
    handleResize();

    // Adicionar listener
    window.addEventListener('resize', handleResize);
    
    // Limpar listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configurações de paginação
  const totalAgents = agents.length;
  const totalPages = Math.ceil(totalAgents / agentsPerPage);
  
  // Obter os agentes para a página atual
  const getPageAgents = () => {
    const start = currentPage * agentsPerPage;
    const end = start + agentsPerPage;
    return agents.slice(start, end);
  };

  // Funções de navegação
  const nextPage = () => {
    if (isAnimating || currentPage >= totalPages - 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const prevPage = () => {
    if (isAnimating || currentPage <= 0) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  // Ir para uma página específica
  const goToPage = (pageNumber: number) => {
    if (isAnimating || pageNumber === currentPage) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setIsAnimating(false);
    }, 300);
  };

  // Obter os agentes da página atual
  const currentAgents = getPageAgents();

  // Distribuir os agentes em múltiplas linhas - lógica melhorada para mobile
  const distributeAgents = () => {
    const distribution = [];
    const agentsCopy = [...currentAgents]; // Trabalhar com uma cópia
    
    // Se for mobile (1 coluna), não reservamos espaço para o card de adicionar na distribuição
    if (columns === 1) {
      // No mobile, simplesmente distribuímos todos os agentes após o add card
      for (let i = 0; i < agentsCopy.length; i++) {
        distribution.push([agentsCopy[i]]);
      }
    } else {
      // Para telas maiores, mantemos a lógica de distribuição original
      const maxAgentsFirstRow = columns - 1; // Reservar 1 espaço para o card de adicionar
      
      // Primeira linha: até maxAgentsFirstRow agentes
      distribution.push(agentsCopy.slice(0, maxAgentsFirstRow));
      
      // Restante dos agentes
      const remainingAgents = agentsCopy.slice(maxAgentsFirstRow);
      
      // Distribuir o restante em linhas completas
      for (let i = 0; i < remainingAgents.length; i += columns) {
        distribution.push(remainingAgents.slice(i, i + columns));
      }
    }
    
    return distribution;
  };

  // Obter a distribuição dos agentes em múltiplas linhas
  const agentRows = distributeAgents();

  // Verificar se precisa mostrar a navegação
  const showNavigation = totalPages > 1;
  
  // Verificar se está na primeira ou última página
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  // Estilo com dimensões fixas para os cards - tamanho aumentado
  const cardSize = 250; // Aumento do tamanho para 250px
  const cardStyle = {
    width: `${cardSize}px`,
    height: `${cardSize}px`,
    display: 'block',
  };

  // Construir o estilo do grid baseado no número de colunas
  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, ${cardSize}px)`,
    columnGap: '1.25rem', // Espaçamento lateral reduzido (20px)
    rowGap: '2rem',       // Espaçamento vertical mantido (32px)
    justifyContent: columns === 1 ? 'center' : 'start',
  };

  // Função para navegar para a página de detalhes do agente
  const handleAgentClick = (agentId: string) => {
    navigate(`/dashboard/company/${company.id}/agents/${agentId}`);
  };

  // Função para navegar para a página de criação de agente
  const handleAddAgent = () => {
    // Navegar para a rota de criação de agente com o companyId na URL
    if (companyId) {
      navigate(`/dashboard/company/${companyId}/agents/create`);
    } else {
      // Fallback para a rota antiga se não houver companyId
      navigate(`/dashboard/agents/create/company`, {
      state: { 
        from: `/dashboard/company/${company.id}/agents`,
        companyId: company.id 
      }
    });
    }
  };

  // Obter o tipo de agente com base no departamento
  const getAgentType = (departmentName: string) => {
    // Lista de departamentos considerados como "Vendas"
    const salesDepartments = ['vendas', 'marketing', 'comercial', 'produtos'];
    
    // Verificar se o nome do departamento contém alguma palavra relacionada a vendas
    const isLikelySales = salesDepartments.some(dept => 
      departmentName.toLowerCase().includes(dept)
    );
    
    return isLikelySales ? 'Vendas' : 'Suporte ao Cliente';
  };

  // Loading state
  if (loadingCompanies) {
    return (
      <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-pulse w-48 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="animate-pulse w-64 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com nome da empresa e controles de paginação */}
      <div className="flex flex-col sm:flex-row items-start gap-2 mb-5 pl-1">
        <div className="flex-1 mb-2 sm:mb-0">
          <h1 className="text-[21px] font-medium text-gray-900 mt-2">
            Meus Agentes - {company.name}
          </h1>
          <p className="text-gray-500 text-sm">Gerenciamento de agentes de IA</p>
        </div>
        
        {/* Controles de navegação em uma linha própria no mobile */}
        {showNavigation && (
          <div className="flex items-center space-x-1 mt-1 sm:mt-0">
            <button 
              onClick={prevPage}
              className={`p-1.5 rounded-full bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-200 shadow-sm ${
                isAnimating || isFirstPage ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              disabled={isAnimating || isFirstPage}
              aria-label="Página anterior"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            {/* Paginação numérica com botões para cada página */}
            <div className="flex space-x-1">
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium
                    ${currentPage === idx
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  disabled={isAnimating || currentPage === idx}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <button 
              onClick={nextPage}
              className={`p-1.5 rounded-full bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-200 shadow-sm ${
                isAnimating || isLastPage ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              disabled={isAnimating || isLastPage}
              aria-label="Próxima página"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Estado de carregamento */}
      {loadingAgents && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-pulse w-48 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="animate-pulse w-64 h-4 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="animate-pulse w-64 h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && !loadingAgents && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => company.id && refetchAgents(company.id)}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Grid container para agentes e card de adicionar */}
      {!loadingAgents && !error && (
        <>
          {agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 mb-2">Nenhum agente encontrado</p>
              <p className="text-gray-500 mb-4">Clique no botão abaixo para criar seu primeiro agente</p>
              <div className="w-64 h-64 mx-auto">
                <AddAgentCard onClick={handleAddAgent} />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pb-8">
              <div className="inline-block min-w-full">
                <div style={gridContainerStyle} className="mx-auto">
                  {/* Card de adicionar agente sempre em primeiro no grid */}
                  <div style={cardStyle} className="mx-auto">
                    <AddAgentCard onClick={handleAddAgent} />
                  </div>
                  
                  {/* Renderizar agentes colocando-os após o card de adicionar */}
                  {currentAgents.map((agent, index) => (
                    <div key={agent.botModelId} style={cardStyle} className="mx-auto">
                      <AgentCard
                        name={agent.botName}
                        type={getAgentType(agent.departmentName)}
                        onClick={() => handleAgentClick(agent.botModelId)}
                        conversationsToday={agent.todayActiveConversationsCount || 0}
                        activeChannels={agent.connectedChannels?.map(channel => channel.channelType) || ['chat']}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 