import { ConfirmDeleteModal } from '@/components/contacts/ConfirmDeleteModal';
import { ContactsFilters } from '@/components/contacts/ContactsFilters';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import { EditContactModal } from '@/components/contacts/EditContactModal';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { useToast } from '@/components/ui/ToastContainer';
import { useClinics } from '@/hooks/use-clinics';
import { useCustomers } from '@/hooks/use-customers';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { Customer, customersService } from '@/services/customers';
import { formatLastMessageDate, formatPhoneNumber, getInitials } from '@/utils/formatters';
import { Edit, Eye, Loader2, Plus, Trash } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

interface ErrorObject {
  message?: string;
  response?: {
    data?: {
      message?: string;
      details?: string;
    };
  };
}

const ContactsPage: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Estado para o modal de edição
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estado para o modal de criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Estado para o modal de confirmação de exclusão
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showError, showSuccess } = useToast();

  const [clinic, setClinic] = useState<{
    name: string;
    id: string | undefined;
  }>({
    name: "Carregando...",
    id: clinicId
  });

  // Buscar as clínicas para encontrar o nome da clínica pelo ID
  const { clinics, loading: loadingClinics } = useClinics();

  // Hook personalizado para gerenciar contatos com paginação e filtros
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
  } = useCustomers(clinicId || '');

  // Hook para scroll infinito
  useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: loadMore,
    threshold: 100,
    scrollContainerRef
  });

  // Atualizar o nome da clínica quando as clínicas forem carregadas
  useEffect(() => {
    if (!loadingClinics && clinics.length > 0 && clinicId) {
      const foundClinic = clinics.find(c => c.id === clinicId);
      
      if (foundClinic) {
        setClinic({
          name: foundClinic.name,
          id: clinicId
        });
      } else {
        setClinic({
          name: "Clínica não encontrada",
          id: clinicId
        });
      }
    }
  }, [clinicId, clinics, loadingClinics]);

  const getStatusBadge = (status: 'active' | 'waiting_response' | 'inactive') => {
    const statusConfig = {
      'active': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        label: 'Conversa Ativa'
      },
      'waiting_response': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        label: 'Aguardando Resposta'
      },
      'inactive': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        label: 'Sem conversa ativa'
      }
    };

    const config = statusConfig[status];
    
    // Fallback caso o status não seja reconhecido
    if (!config) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
          Status desconhecido
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  // Função para gerar cor estável baseada no nome (mesma paleta da tela de conversas)
  const generateStableColor = (name: string): string => {
    if (!name) return "#6366f1"; // indigo-500 como fallback
    
    // Hash do nome para obter um número consistente
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Lista de cores vibrantes (mesma paleta usada no AvatarWithStatus)
    const colors = [
      "#f43f5e", // rose-500
      "#ec4899", // pink-500
      "#d946ef", // fuchsia-500
      "#a855f7", // purple-500
      "#8b5cf6", // violet-500
      "#6366f1", // indigo-500
      "#3b82f6", // blue-500
      "#0ea5e9", // sky-500
      "#06b6d4", // cyan-500
      "#14b8a6", // teal-500
      "#10b981", // emerald-500
      "#22c55e", // green-500
      "#84cc16", // lime-500
      "#eab308", // yellow-500
      "#f59e0b", // amber-500
      "#f97316", // orange-500
      "#ef4444", // red-500
    ];
    
    // Usa o hash para escolher uma cor
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Função para abrir modal de edição
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  // Função para fechar modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    setIsSaving(false);
  };

  // Função para salvar alterações
  const handleSaveCustomer = async (updatedCustomer: Customer) => {
    setIsSaving(true);
    try {
      await customersService.updateCustomer(updatedCustomer.id, {
        name: updatedCustomer.name,
        phoneNumber: updatedCustomer.phoneNumber,
        customerReferenceId: updatedCustomer.customerReferenceId
      });
      
      // Refazer a busca para atualizar a lista
      await refresh();
      
      handleCloseEditModal();
      
      console.log('Contato atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      // TODO: Mostrar mensagem de erro
    } finally {
      setIsSaving(false);
    }
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
  }) => {
    try {
      setIsCreatingCustomer(true);
      console.log('Tentando criar cliente:', customerData);
      
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

  // Função para abrir modal de confirmação de exclusão
  const handleDeleteCustomer = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  // Função para fechar modal de confirmação
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCustomer(null);
    setIsDeleting(false);
  };

  // Função para confirmar a exclusão
  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;

    setIsDeleting(true);
    try {
      await customersService.deleteCustomer(deletingCustomer.id);
      
      // Refazer a busca para atualizar a lista
      await refresh();
      
      handleCloseDeleteModal();
      
      console.log('Contato excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      // TODO: Mostrar mensagem de erro
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-center">
          <p className="text-lg font-medium">Erro ao carregar contatos</p>
          <p className="text-sm mt-1">{error}</p>
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

  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com nome da clínica */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-5 pl-1">
        <div className="flex-1 mb-2 sm:mb-0">
          <h1 className="text-[21px] font-medium text-gray-900 mt-2">
            Contatos - {clinic.name}
          </h1>
          <p className="text-gray-500 text-sm">Gerencie seus leads e contatos</p>
        </div>
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

      {/* Componente de filtros */}
      <ContactsFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={pagination?.totalCount}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Container scrollável para a tabela */}
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto overflow-x-auto max-h-[600px]"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Canal
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status da Última Interação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => {
                // Verificar se o customer e seus campos existem antes de processar
                const customerName = customer?.name || 'Nome não disponível';
                const customerPhone = customer?.phoneNumber || '';
                const initials = getInitials(customerName);
                const avatarColor = generateStableColor(customerName);
                
                return (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
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
                        <WhatsAppIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatPhoneNumber(customerPhone)}
                        </span>
                      </div>
                    </td>

                    {/* Coluna Canal */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <WhatsAppIcon className="h-5 w-5" />
                      </div>
                    </td>

                    {/* Coluna Status */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(customer.lastChatLogStatus)}
                    </td>

                    {/* Coluna Ações */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditCustomer(customer)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A24] transition-colors"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(customer)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          <Trash className="h-3 w-3 mr-1" />
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Loading indicator para scroll infinito */}
              {loading && customers.length > 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-[#F15A24] mr-2" />
                      <span className="text-sm text-gray-500">Carregando mais contatos...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Estado vazio dentro do scroll */}
          {customers.length === 0 && !loading && (
            <div className="text-center py-12">
              <WhatsAppIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum contato encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.name || filters.phoneNumber || filters.lastChatLogStatus
                  ? 'Tente ajustar os filtros para encontrar contatos.'
                  : 'Quando você tiver contatos, eles aparecerão aqui.'
                }
              </p>
            </div>
          )}

          {/* Loading inicial dentro do scroll */}
          {loading && customers.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
            </div>
          )}
        </div>
      </div>

      {/* Indicador de fim dos resultados */}
      {!hasMore && customers.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Todos os contatos foram carregados ({pagination?.totalCount || customers.length} total)
          </p>
        </div>
      )}

      {/* Modal de edição */}
      <EditContactModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        isLoading={isSaving}
      />

      {/* Modal de criação */}
      <CreateContactModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSave={handleSaveNewCustomer}
        isLoading={isCreatingCustomer}
      />

      {/* Modal de confirmação de exclusão */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        customerName={deletingCustomer?.name || ''}
      />
    </div>
  );
};

export default ContactsPage; 