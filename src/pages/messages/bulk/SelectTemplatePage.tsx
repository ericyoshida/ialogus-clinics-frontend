import { BulkMessageStepIndicator } from '@/components/ui/bulk-message-step-indicator';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { FeatureCard } from '@/components/ui/feature-card';
import { useBulkMessageForm } from '@/hooks/use-bulk-message-form';
import { useClinics } from '@/hooks/use-clinics';
import { useToast } from '@/hooks/use-toast';
import { api, messageTemplatesService } from '@/services';
import { WhatsappMessageTemplate } from '@/services/messageTemplates';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Lista de etapas do fluxo de envio de mensagens - agora com 4 etapas
const BULK_MESSAGE_STEPS = [
  "Selecionar Canal",
  "Selecionar Agente",
  "Selecionar Template", 
  "Selecionar Contatos"
];

// Card de adicionar novo template
function AddTemplateCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      <button
        onClick={onClick}
        className="w-full h-full bg-transparent border-none outline-none focus:outline-none cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:drop-shadow-[6px_6px_10px_rgba(0,0,0,0.15)]"
        aria-label="Adicionar novo template"
      >
        <img 
          src="/images/add-message-template.svg" 
          alt="Adicionar template"
          className="w-full h-full object-contain"
        />
      </button>
    </div>
  );
}

// Card de template selecionável
function SelectableTemplateCard({ 
  template, 
  selected, 
  onClick,
  onEdit,
  onDelete
}: { 
  template: WhatsappMessageTemplate;
  selected: boolean;
  onClick: () => void;
  onEdit: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}) {
  // Truncar o conteúdo do template para descrição (aumentado para mostrar mais texto)
  const truncateText = (templateBody: { bodyText: string; bodyVariables: string[] }, maxLength: number = 150) => {
    const textContent = templateBody.bodyText || '';
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength) + '...';
  };

  // Função para formatar o nome do template
  const formatTemplateName = (name: string) => {
    return name
      .replace(/_/g, ' ') // Substitui _ por espaço
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza cada palavra
      .join(' ');
  };

  // Função para traduzir o status
  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  // Função para mapear status para cor da badge
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Determinar a cor do card baseado no status
  const getCardGradientColors = () => {
    switch (template.messageTemplateStatus.toLowerCase()) {
      case 'approved':
        return { from: '#10B981', to: '#059669' }; // Verde para aprovado
      case 'pending':
        return { from: '#F59E0B', to: '#D97706' }; // Amarelo para pendente
      case 'rejected':
        return { from: '#EF4444', to: '#DC2626' }; // Vermelho para rejeitado
      default:
        return { from: '#6B7280', to: '#4B5563' }; // Cinza para outros
    }
  };

  const handleEditTemplate = () => {
    onEdit(template.whatsappMessageTemplateId);
  };

  const handleDeleteTemplate = () => {
    onDelete(template.whatsappMessageTemplateId);
  };

  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      {selected && (
        <div className="absolute -top-5 left-3 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white">
          Selecionado
        </div>
      )}
      
      <div className={`w-full h-full ${selected ? 'ring-2 ring-offset-2 ring-orange-500' : ''}`}>
        <FeatureCard
          title={formatTemplateName(template.messageTemplateName)}
          description={truncateText(template.whatsappMessageTemplateBody)}
          icon={
            <img 
              src="/images/icons/chat.svg" 
              alt="Chat" 
              className="w-6 h-6"
            />
          }
          gradientColors={getCardGradientColors()}
          decorativeElement="svg"
          svgPath="/images/message-image.svg"
          className="w-full h-full [&_p]:w-[150px] [&_p]:text-xs [&_p]:pr-2 [&_p]:leading-normal"
          onClick={onClick}
          showMenu={true}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
          editLabel="Editar"
          deleteLabel="Remover"
        />
      </div>
      
      {/* Badge posicionada absolutamente fora do sistema do FeatureCard */}
      <div className="absolute bottom-4 left-4 z-30">
        <span className={`inline-block px-2 py-0.5 text-xs font-medium border rounded-full ${getStatusColor(template.messageTemplateStatus)}`}>
          {translateStatus(template.messageTemplateStatus)}
        </span>
      </div>
      
      {selected && (
        <div 
          className="absolute inset-0 z-5 rounded-lg pointer-events-none bg-orange-500 opacity-10"
        />
      )}
    </div>
  );
}

export default function SelectTemplatePage() {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  const { selectedChannelId, selectedAgentId, selectedTemplateId, updateFormData } = useBulkMessageForm();
  const { toast } = useToast();
  
  // Buscar nome da clínica
  const { clinics } = useClinics();
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...';
  
  // Estados para templates
  const [allTemplates, setAllTemplates] = useState<WhatsappMessageTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [refreshingTemplates, setRefreshingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para o modal de confirmação
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    templateId: '',
    templateName: '',
    isDeleting: false
  });

  // Função para buscar templates
  const fetchTemplates = async () => {
    if (!selectedChannelId || !selectedAgentId) {
      console.error('Canal ou agente não selecionado para buscar templates');
      setError('Canal ou agente não selecionado');
      setLoadingTemplates(false);
      return;
    }

    try {
      setError(null);
      console.log('🔍 Buscando templates para agente:', selectedAgentId, 'e canal:', selectedChannelId);
      
      const templatesResponse = await messageTemplatesService.getWhatsappMessageTemplatesByBotModelAndChannel(
        selectedAgentId,
        selectedChannelId
      );
      
      console.log('✅ Templates carregados:', templatesResponse);
      setAllTemplates(templatesResponse.whatsappMessageTemplates || []);
      
      if (!templatesResponse.whatsappMessageTemplates || templatesResponse.whatsappMessageTemplates.length === 0) {
        console.warn('⚠️ Nenhum template encontrado para o agente e canal selecionados');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar templates:', err);
      setError('Erro ao carregar templates de mensagem');
    }
  };

  // Buscar templates quando o componente montar
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      await fetchTemplates();
      setLoadingTemplates(false);
    };

    loadTemplates();
  }, [selectedChannelId, selectedAgentId]);

  // Função para atualizar templates
  const handleRefreshTemplates = async () => {
    if (!selectedChannelId) {
      console.error('Canal não selecionado para atualizar templates');
      toast({
        title: "Erro",
        description: "Nenhum canal selecionado para atualizar templates.",
        variant: "destructive",
      });
      return;
    }

    setRefreshingTemplates(true);
    try {
      console.log('Refreshing templates for WhatsApp channel:', selectedChannelId);
      await messageTemplatesService.updateWhatsappTemplates(selectedChannelId);
      
      toast({
        title: "Templates atualizados",
        description: "Os templates do WhatsApp foram atualizados com sucesso.",
        variant: "default",
      });
      
      // Refetch templates after update
      await fetchTemplates();
    } catch (error) {
      console.error('Error refreshing templates:', error);
      setError('Erro ao atualizar templates. Tente novamente.');
      
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os templates. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setRefreshingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    // Encontrar o template completo nos dados carregados
    const selectedTemplate = allTemplates.find(template => template.whatsappMessageTemplateId === templateId);
    
    if (selectedTemplate) {
      updateFormData({ 
        selectedTemplateId: templateId,
        selectedTemplateData: {
          whatsappMessageTemplateId: selectedTemplate.whatsappMessageTemplateId,
          whatsappChannelId: selectedTemplate.whatsappChannelId,
          messageTemplateName: selectedTemplate.messageTemplateName,
        },
        step: 2 
      });
    } else {
      updateFormData({ selectedTemplateId: templateId, step: 2 });
    }
  };

  // Função para adicionar novo template
  const handleAddNewTemplate = () => {
    navigate(`/dashboard/clinic/${clinicId}/messages/bulk/template/create`);
  };

  // Função para editar template
  const handleEditTemplate = (templateId: string) => {
    const template = allTemplates.find(t => t.whatsappMessageTemplateId === templateId);
    if (template) {
      // Passar os dados do template via state da navegação
      navigate(`/dashboard/clinic/${clinicId}/messages/bulk/template/edit/${templateId}`, {
        state: { templateData: template }
      });
    } else {
      toast({
        title: "Erro",
        description: "Template não encontrado.",
        variant: "destructive",
      });
    }
  };

  // Função para deletar template
  const handleDeleteTemplate = async (templateId: string) => {
    const template = allTemplates.find(t => t.whatsappMessageTemplateId === templateId);
    if (!template) return;

    setDeleteModal({
      isOpen: true,
      templateId: templateId,
      templateName: template.messageTemplateName,
      isDeleting: false
    });
  };

  // Função para confirmar a exclusão
  const handleConfirmDelete = async () => {
    if (!deleteModal.templateId) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      // Chamar API para deletar template usando a rota correta do backend
      const response = await api.delete(`/whatsapp-message-templates/${deleteModal.templateId}/api`, {
        data: {
          deleteByName: false,
        }
      });

      if (response.status !== 200) {
        const errorData = response.data;
        throw new Error(errorData.message || 'Erro ao deletar template');
      }

      const responseData = response.data;

      // Atualizar lista de templates removendo o deletado
      setAllTemplates(prev => prev.filter(t => t.whatsappMessageTemplateId !== deleteModal.templateId));
      
      // Se o template deletado estava selecionado, limpar seleção
      if (selectedTemplateId === deleteModal.templateId) {
        updateFormData({ selectedTemplateId: null });
      }

      toast({
        title: "Template removido com sucesso",
        description: `O template "${deleteModal.templateName}" foi removido ${responseData.apiSuccess ? 'da API do WhatsApp' : 'localmente'}.`,
      });

      // Fechar modal
      setDeleteModal({
        isOpen: false,
        templateId: '',
        templateName: '',
        isDeleting: false
      });
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      toast({
        title: "Erro ao remover template",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao remover o template. Tente novamente.",
        variant: "destructive",
      });
      
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Função para fechar o modal de confirmação
  const handleCloseDeleteModal = () => {
    if (deleteModal.isDeleting) return; // Não permitir fechar durante exclusão
    
    setDeleteModal({
      isOpen: false,
      templateId: '',
      templateName: '',
      isDeleting: false
    });
  };

  // Função para avançar para próxima etapa
  const handleNext = () => {
    navigate(`/dashboard/clinic/${clinicId}/messages/bulk/contacts`);
  };

  // Função para voltar para etapa anterior
  const handleBack = () => {
    navigate(`/dashboard/clinic/${clinicId}/messages/bulk/agent`);
  };

  // Verificar se pode prosseguir
  const canProceed = selectedTemplateId !== null;

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
            currentStep={2} 
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-medium text-gray-800">Selecionar Template</h2>
          
          {/* Botão de refresh */}
          <button
            onClick={handleRefreshTemplates}
            disabled={refreshingTemplates || loadingTemplates}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Atualizar templates do WhatsApp"
          >
            <ArrowPathIcon 
              className={`w-4 h-4 ${refreshingTemplates ? 'animate-spin' : ''}`} 
            />
            {refreshingTemplates ? 'Atualizando...' : 'Atualizar Templates'}
          </button>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-1">Etapa 3: Escolha o template de mensagem para envio</p>
      </div>

      {/* Cards de templates */}
      <div className="mb-2">
        {loadingTemplates ? (
          // Estado de carregamento
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse space-y-4">
              <div className="flex space-x-10">
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
              </div>
              <p className="text-center text-gray-500">Carregando templates...</p>
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
        ) : allTemplates.length === 0 ? (
          // Caso especial: quando não há templates, mostrar apenas o card de criar
          <div className="overflow-x-auto overflow-y-hidden py-1">
            <div className="flex gap-5 min-w-max px-1 py-1">
              <AddTemplateCard onClick={handleAddNewTemplate} />
            </div>
          </div>
        ) : (
          // Templates existentes com card de criar no início - todos os templates de uma vez
          <div className="overflow-x-auto overflow-y-hidden py-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
            <div className="flex gap-5 min-w-max px-1 py-1">
              {/* Card para criar novo template - sempre no início */}
              <AddTemplateCard onClick={handleAddNewTemplate} />
              
              {allTemplates.map((template) => (
                <SelectableTemplateCard
                  key={template.whatsappMessageTemplateId}
                  template={template}
                  selected={selectedTemplateId === template.whatsappMessageTemplateId}
                  onClick={() => handleTemplateSelect(template.whatsappMessageTemplateId)}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                />
              ))}
            </div>
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
          className="px-5 py-2 rounded-md text-white transition-colors"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)',
            opacity: canProceed ? 1 : 0.7 
          }}
          disabled={!canProceed || loadingTemplates}
        >
          Próximo
        </button>
      </div>

      {/* Modal de confirmação para exclusão */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Remover Template"
        message={`Tem certeza que deseja remover o template "${deleteModal.templateName}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
} 