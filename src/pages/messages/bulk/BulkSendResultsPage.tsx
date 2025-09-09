import { BulkSendProgressComponent } from '@/components/ui/bulk-send-progress';
import { useBulkSendProgress } from '@/hooks/use-bulk-send-progress';
import { ArrowLeft, MessageCircle, Users } from 'lucide-react';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BulkSendResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extrair parâmetros da URL
  const jobId = searchParams.get('jobId');
  const departmentId = searchParams.get('departmentId');
  const whatsappChannelId = searchParams.get('whatsappChannelId');
  const whatsappMessageTemplateId = searchParams.get('whatsappMessageTemplateId');

  // Hook para rastrear progresso do envio
  const { 
    progress, 
    isPolling, 
    error: progressError
  } = useBulkSendProgress({
    departmentId: departmentId || '',
    whatsappChannelId: whatsappChannelId || '',
    whatsappMessageTemplateId: whatsappMessageTemplateId || '',
    jobId: jobId || undefined,
    pollingInterval: 2000,
    autoStop: true
  });

  // Função para voltar para o seletor de contatos
  const handleSendMoreMessages = () => {
    navigate('/dashboard/messages/bulk/contacts');
  };

  // Função para ir para a página de conversas
  const handleViewConversations = () => {
    navigate('/dashboard/conversations');
  };

  // Função para voltar ao início do fluxo
  const handleBackToStart = () => {
    navigate('/dashboard/messages/bulk/channel');
  };

  // Verificar se temos os parâmetros necessários
  if (!jobId || !departmentId || !whatsappChannelId || !whatsappMessageTemplateId) {
    return (
      <div className="max-w-7xl h-[calc(100vh-80px)] flex items-center justify-center -mt-4 px-2 sm:px-3 lg:px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Parâmetros inválidos</p>
          <p className="text-sm mt-1 text-red-500">
            Os dados do envio não foram encontrados. Volte e tente novamente.
          </p>
          <button
            onClick={handleBackToStart}
            className="mt-4 px-4 py-2 bg-[#F15A24] text-white rounded-md hover:bg-[#E14A1A] transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const isJobCompleted = progress && (progress.status === 'completed' || progress.status === 'failed');

  return (
    <div className="max-w-4xl mx-auto flex flex-col -mt-4 px-2 sm:px-3 lg:px-4 pb-6" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={handleBackToStart}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[21px] font-medium text-gray-900">
              Resultado do Envio em Massa
            </h1>
            <p className="text-gray-500 text-sm">
              Acompanhe o progresso e resultados do seu envio de mensagens
            </p>
          </div>
        </div>

        {/* Job ID */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">ID do Trabalho</p>
              <p className="text-xs text-gray-500 font-mono">{jobId}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  isPolling ? 'bg-blue-500 animate-pulse' : 
                  isJobCompleted ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-sm text-gray-600">
                {isPolling ? 'Monitorando...' : 
                 isJobCompleted ? 'Concluído' : 'Parado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de progresso */}
      <div className="flex-1 mb-6">
        <BulkSendProgressComponent 
          progress={progress}
          isPolling={isPolling}
          error={progressError}
          className="w-full h-full"
        />
      </div>

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row gap-4 mt-auto">
        {/* Botão para enviar mais mensagens */}
        <button
          onClick={handleSendMoreMessages}
          className="flex-1 px-6 py-3 rounded-md text-white transition-colors flex items-center justify-center space-x-2"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)'
          }}
        >
          <MessageCircle className="h-5 w-5" />
          <span>Enviar Mais Mensagens</span>
        </button>

        {/* Botão para visualizar conversas */}
        <button
          onClick={handleViewConversations}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Users className="h-5 w-5" />
          <span>Visualizar Conversas</span>
        </button>
      </div>

      {/* Informações adicionais */}
      {isJobCompleted && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Envio {progress?.status === 'completed' ? 'Concluído' : 'Finalizado'}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {progress?.status === 'completed' 
                  ? 'Todas as mensagens foram processadas com sucesso.'
                  : 'O processo de envio foi finalizado. Verifique os detalhes acima.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkSendResultsPage; 