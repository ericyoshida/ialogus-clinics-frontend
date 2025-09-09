import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import { BulkMessageStepIndicator } from '@/components/ui/bulk-message-step-indicator';
import { useToast } from '@/components/ui/ToastContainer';
import { useBulkMessageForm } from '@/hooks/use-bulk-message-form';
import { useCompanies } from '@/hooks/use-companies';
import { useCustomers } from '@/hooks/use-customers';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { bulkMessagesService } from '@/services/bulkMessages';
import { Customer, customersService } from '@/services/customers';
import { formatLastMessageDate, formatPhoneNumber, getInitials } from '@/utils/formatters';
import { ChevronLeftIcon, Eye, Loader2, Plus, SearchIcon } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Lista de etapas do fluxo de envio de mensagens - agora com 4 etapas
const BULK_MESSAGE_STEPS = [
  "Selecionar Canal",
  "Selecionar Agente",
  "Selecionar Template", 
  "Selecionar Contatos"
];

const SelectContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRequestInProgress = useRef(false); // Novo ref para rastrear requisições em andamento
  const { 
    selectedAgentId, 
    selectedAgentData,
    selectedChannelId,
    selectedChannelData,
    selectedTemplateId, 
    selectedTemplateData,
    selectedContacts: savedSelectedContacts, 
    updateFormData 
  } = useBulkMessageForm();
  const { showError, showSuccess } = useToast();

  // Buscar as empresas para obter uma empresa válida
  const { companies, loading: loadingCompanies } = useCompanies();
  const companyName = companies.find(c => c.id === companyId)?.name || 'Carregando...';

  // Estados para seleção
  const [selectedContactsSet, setSelectedContactsSet] = useState<Set<string>>(new Set(savedSelectedContacts || []));
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Estado para filtro de nome
  const [nameFilter, setNameFilter] = useState('');

  // Estados para o modal de criação de contato
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Hook para gerenciar contatos - só executa quando temos um companyId válido
  const {
    customers,
    loading,
    error,
    hasMore,
    pagination,
    filters,
    setFilters,
    loadMore,
    refresh,
    createCustomer
  } = useCustomers(companyId);

  // Hook para scroll infinito
  useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: loadMore,
    threshold: 100,
    scrollContainerRef
  });

  // Aplicar filtro de nome quando mudado
  useEffect(() => {
    if (nameFilter !== filters.name) {
      setFilters({
        page: 1,
        perPage: 20,
        name: nameFilter
      });
    }
  }, [nameFilter, setFilters]);

  // Verificar se um contato é válido para envio (apenas status inactive)
  const isValidForSending = (customer: Customer) => {
    return customer.lastChatLogStatus === 'inactive';
  };

  // Obter apenas contatos válidos para envio
  const validContacts = customers.filter(isValidForSending);

  // Gerenciar select all baseado apenas em contatos válidos
  useEffect(() => {
    if (validContacts.length > 0) {
      const validContactIds = validContacts.map(c => c.id);
      const selectedValidContacts = validContactIds.filter(id => selectedContactsSet.has(id));
      setSelectAll(selectedValidContacts.length === validContactIds.length);
    } else {
      setSelectAll(false);
    }
  }, [validContacts, selectedContactsSet]);

  // Função para carregar TODOS os contatos válidos para seleção
  const loadAllValidContacts = useCallback(async () => {
    if (!companyId) return [];

    try {
      // Primeiro, buscar a primeira página para obter o totalCount
      const initialResponse = await customersService.getCustomers(companyId, {
        page: 1,
        perPage: 20,
        name: nameFilter,
        lastChatLogStatus: 'inactive'
      });

      const totalCount = initialResponse.pagination?.totalCount || 0;
      
      if (totalCount === 0) {
        return [];
      }

      // Agora buscar todos os contatos usando o totalCount real
      const response = await customersService.getCustomers(companyId, {
        page: 1,
        perPage: totalCount, // Usar o número real total
        name: nameFilter, // Aplicar o filtro de nome atual
        lastChatLogStatus: 'inactive' // Filtro para contatos válidos para envio
      });
      
      // Como já filtramos na API por status inactive, todos os retornados são válidos
      return response.customers;
    } catch (error) {
      console.error('Erro ao carregar todos os contatos:', error);
      return [];
    }
  }, [companyId, nameFilter]);

  // Gerenciar select all (TODOS os contatos válidos, não apenas os visíveis)
  const handleSelectAll = async () => {
    if (selectAll) {
      // Deselecionar todos os válidos visíveis
      const newSelectedContacts = new Set(selectedContactsSet);
      validContacts.forEach(contact => {
        newSelectedContacts.delete(contact.id);
      });
      setSelectedContactsSet(newSelectedContacts);
    } else {
      // Carregar e selecionar TODOS os contatos válidos
      showSuccess('Buscando todos os contatos válidos para envio...');
      const allValidContacts = await loadAllValidContacts();
      
      const newSelectedContacts = new Set(selectedContactsSet);
      allValidContacts.forEach(contact => {
        newSelectedContacts.add(contact.id);
      });
      setSelectedContactsSet(newSelectedContacts);
      
      if (allValidContacts.length > 0) {
        showSuccess(`${allValidContacts.length} contatos válidos selecionados${nameFilter ? ` (filtro: "${nameFilter}")` : ''}!`);
      } else {
        showSuccess('Nenhum contato válido encontrado para seleção.');
      }
    }
  };

  // Função para gerar cor estável baseada no nome
  const generateStableColor = (name: string): string => {
    if (!name) return "#6366f1";
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#6366f1", 
      "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#22c55e", 
      "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444"
    ];
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Badge de status para válido/inválido para envio
  const getValidityBadge = (customer: Customer) => {
    const status = customer.lastChatLogStatus;
    
    if (status === 'inactive') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
          Válido para envio
        </span>
      );
    } else if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
          Conversa ativa
        </span>
      );
    } else if (status === 'waiting_response') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
          Aguardando resposta
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
          Status desconhecido
        </span>
      );
    }
  };

  // Gerenciar seleção individual
  const handleContactSelect = (contactId: string) => {
    const customer = customers.find(c => c.id === contactId);
    if (!customer || !isValidForSending(customer)) return;

    const newSelectedContacts = new Set(selectedContactsSet);
    if (newSelectedContacts.has(contactId)) {
      newSelectedContacts.delete(contactId);
    } else {
      newSelectedContacts.add(contactId);
    }
    setSelectedContactsSet(newSelectedContacts);
  };

  // Função para abrir modal de criação
  const handleCreateCustomer = () => {
    setIsCreateModalOpen(true);
  };

  // Função para fechar modal de criação
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setIsCreatingCustomer(false);
  };

  // Função para criar novo contato
  const handleSaveNewCustomer = async (customerData: {
    name: string;
    phoneNumber: string;
    department?: string;
  }) => {
    try {
      setIsCreatingCustomer(true);
      console.log('Tentando criar cliente:', customerData);
      
      // Usar o hook de customers para criar o contato
      await createCustomer(customerData);
      
      console.log('Cliente criado com sucesso');
      showSuccess('Contato criado com sucesso!');
      
      // Recarregar a lista de clientes
      await refresh();
      
      // Fechar o modal
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('já existe um cliente com este número de telefone')) {
          showError('Já existe um contato com este número de telefone. Por favor, use um número diferente.');
        } else {
          showError(error.message || 'Erro ao criar contato. Tente novamente.');
        }
      } else {
        showError('Erro inesperado ao criar contato. Tente novamente.');
      }
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Navegação
  const handleBack = () => {
    navigate(`/dashboard/company/${companyId}/messages/bulk/template`);
  };

  const handleNext = useCallback(async () => {
    // Verificação adicional para evitar requisições duplicadas
    if (isRequestInProgress.current) {
      console.log('⚠️ Requisição já em andamento, ignorando clique duplicado');
      return;
    }

    if (selectedContactsSet.size === 0) {
      showError('Selecione pelo menos um contato para enviar a mensagem.');
      return;
    }

    // Verificar se temos os dados necessários salvos no formulário
    if (!selectedAgentData || !selectedChannelData || !selectedTemplateData) {
      showError('Dados do agente, canal ou template não encontrados. Volte e selecione novamente.');
      return;
    }

    // Verificar se os dados essenciais estão presentes
    if (!selectedAgentData.departmentId || !selectedChannelData.id || !selectedTemplateData.whatsappMessageTemplateId) {
      showError('Dados essenciais do agente, canal ou template estão faltando. Volte e selecione novamente.');
      return;
    }

    // Marcar requisição como em andamento
    isRequestInProgress.current = true;
    setSending(true);

    try {
      console.log('📤 Iniciando envio em massa para', selectedContactsSet.size, 'contatos');
      
      // Usar os dados já salvos no formulário - agora usando o canal selecionado
      const response = await bulkMessagesService.sendBulkTemplateMessage(
        selectedAgentData.departmentId,
        selectedChannelData.id, // Usar o canal selecionado em vez do canal do template
        selectedTemplateData.whatsappMessageTemplateId,
        Array.from(selectedContactsSet)
      );

      console.log('✅ Envio em massa iniciado com sucesso, Job ID:', response.jobId);
      showSuccess(`Envio iniciado! Redirecionando para acompanhar o progresso...`);

      // Salvar dados no formulário
      updateFormData({ 
        selectedContacts: Array.from(selectedContactsSet),
        step: 4 
      });

      // Navegar para a página de resultados com os parâmetros necessários
      const params = new URLSearchParams({
        jobId: response.jobId,
        departmentId: selectedAgentData.departmentId,
        whatsappChannelId: selectedChannelData.id, // Usar o canal selecionado
        whatsappMessageTemplateId: selectedTemplateData.whatsappMessageTemplateId
      });

      navigate(`/dashboard/company/${companyId}/messages/bulk/results?${params.toString()}`);
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem em massa:', error);
      showError(
        error instanceof Error 
          ? `Erro ao enviar mensagem: ${error.message}` 
          : 'Erro inesperado ao enviar mensagem. Tente novamente.'
      );
    } finally {
      setSending(false);
      isRequestInProgress.current = false; // Liberar flag de requisição
    }
  }, [
    selectedContactsSet,
    selectedAgentData,
    selectedTemplateData,
    showError,
    showSuccess,
    updateFormData,
    navigate,
    selectedChannelData
  ]);

  // Verificar se pode prosseguir - adicionar verificação do ref
  const canProceed = selectedContactsSet.size > 0 && !sending && !isRequestInProgress.current;

  if (error) {
    return (
      <div className="max-w-7xl h-[calc(100vh-80px)] flex items-center justify-center -mt-4 px-2 sm:px-3 lg:px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Erro ao carregar contatos</p>
          <p className="text-sm mt-1 text-red-500">{error}</p>
          <button
            onClick={refresh}
            className="mt-3 px-4 py-2 bg-[#F15A24] text-white rounded-md hover:bg-[#E14A1A] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Mostrar loading enquanto as empresas estão sendo carregadas
  if (loadingCompanies) {
    return (
      <div className="max-w-7xl h-[calc(100vh-80px)] flex items-center justify-center -mt-4 px-2 sm:px-3 lg:px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#F15A24] mr-2" />
          <span className="text-gray-600">Carregando empresas...</span>
        </div>
      </div>
    );
  }

  // Verificar se não há empresas disponíveis
  if (!loadingCompanies && companies.length === 0) {
    return (
      <div className="max-w-7xl h-[calc(100vh-80px)] flex items-center justify-center -mt-4 px-2 sm:px-3 lg:px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">Nenhuma empresa encontrada</p>
          <p className="text-sm mt-1 text-gray-500">É necessário ter pelo menos uma empresa para visualizar os contatos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl flex flex-col -mt-4 px-2 sm:px-3 lg:px-4 pb-6" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header com título e subtítulo */}
      <div className="flex flex-col mb-1">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Enviar Mensagem Quebra-gelo
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{companyName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Defina os detalhes da mensagem a ser enviada para seus clientes.</p>
        
        <div className="w-full mb-6">
          <BulkMessageStepIndicator 
            steps={BULK_MESSAGE_STEPS} 
            currentStep={3} 
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-medium text-gray-800">Selecionar Contatos</h2>
          <button
            onClick={handleCreateCustomer}
            className="px-5 py-2 rounded-md text-white transition-colors h-10 inline-flex items-center shadow-sm"
            style={{ 
              background: 'linear-gradient(90deg, #F6921E, #EE413D)'
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </button>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-1">Etapa 4: Escolha os contatos que receberão a mensagem</p>
      </div>

      {/* Container principal que se ajusta conforme o progresso */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Filtro de nome */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#F15A24] focus:border-[#F15A24] sm:text-sm"
            />
          </div>
        </div>

        {/* Contador de selecionados */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedContactsSet.size > 0 && (
              <span className="font-medium text-[#F15A24]">
                {selectedContactsSet.size} contatos selecionados
              </span>
            )}
            {validContacts.length > 0 && (
              <span className="ml-2 text-gray-500">
                ({validContacts.length} válidos de {customers.length} carregados)
              </span>
            )}
            {pagination?.totalCount && (
              <span className="ml-2 text-gray-500">
                • Total: {pagination.totalCount} contatos
              </span>
            )}
          </div>
        </div>

        {/* Tabela de contatos - flex-1 para ocupar espaço restante */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 min-h-0">
          <div 
            ref={scrollContainerRef}
            className="overflow-y-auto overflow-x-auto h-full"
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        disabled={validContacts.length === 0}
                        className="h-4 w-4 text-[#F15A24] focus:ring-[#F15A24] border-gray-300 rounded disabled:opacity-50"
                      />
                      <span className="ml-2">Selecionar</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Válido para envio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => {
                  const customerName = customer?.name || 'Nome não disponível';
                  const customerPhone = customer?.phoneNumber || '';
                  const initials = getInitials(customerName);
                  const avatarColor = generateStableColor(customerName);
                  const valid = isValidForSending(customer);
                  const isSelected = selectedContactsSet.has(customer.id);
                  
                  return (
                    <tr 
                      key={customer.id} 
                      className={`transition-colors ${
                        valid 
                          ? 'hover:bg-gray-50 cursor-pointer' 
                          : 'bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => valid && handleContactSelect(customer.id)}
                    >
                      {/* Coluna Checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleContactSelect(customer.id)}
                          disabled={!valid}
                          className="h-4 w-4 text-[#F15A24] focus:ring-[#F15A24] border-gray-300 rounded disabled:opacity-50"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      {/* Coluna Nome */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {initials}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customerName}
                            </div>
                            {customer.department && (
                              <div className="text-sm text-gray-500">
                                {customer.department}
                              </div>
                            )}
                            {customer.lastMessageDate && (
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <Eye className="h-3 w-3 mr-1" />
                                <span>Última mensagem {formatLastMessageDate(customer.lastMessageDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Coluna Contato */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">
                            {formatPhoneNumber(customerPhone)}
                          </span>
                        </div>
                      </td>

                      {/* Coluna Status de Validade */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getValidityBadge(customer)}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Loading indicator para scroll infinito */}
                {loading && customers.length > 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-[#F15A24] mr-2" />
                        <span className="text-sm text-gray-500">Carregando mais contatos...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Estado vazio */}
            {customers.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 flex items-center justify-center">
                  <ChevronLeftIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum contato encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {nameFilter
                    ? 'Tente ajustar o filtro para encontrar contatos.'
                    : 'Quando você tiver contatos, eles aparecerão aqui.'
                  }
                </p>
              </div>
            )}

            {/* Loading inicial */}
            {loading && customers.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
              </div>
            )}
          </div>
        </div>

        {/* Indicador de fim dos resultados */}
        {!hasMore && customers.length > 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">
              Todos os contatos foram carregados ({pagination?.totalCount || customers.length} total)
            </p>
          </div>
        )}

        {/* Botões de navegação */}
        <div className="flex mt-4">
          <button
            onClick={handleBack}
            disabled={sending}
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>
          
          <div className="flex-grow"></div>
          
          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-md text-white transition-colors flex items-center"
            style={{ 
              background: 'linear-gradient(90deg, #F6921E, #EE413D)',
              opacity: canProceed ? 1 : 0.7 
            }}
            disabled={!canProceed || loading}
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {sending 
              ? 'Enviando...' 
              : selectedContactsSet.size > 0 
                ? `Enviar para ${selectedContactsSet.size} contatos` 
                : 'Próximo'
            }
          </button>
        </div>
      </div>

      {/* Modal de criação de contato */}
      <CreateContactModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSave={handleSaveNewCustomer}
        isLoading={isCreatingCustomer}
      />
    </div>
  );
};

export default SelectContactsPage; 