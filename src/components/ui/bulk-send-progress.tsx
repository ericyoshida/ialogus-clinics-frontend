import { BulkSendProgress } from '@/services/bulkMessages';
import { AlertCircle, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import React from 'react';

interface BulkSendProgressProps {
  progress: BulkSendProgress | null;
  isPolling: boolean;
  error: string | null;
  className?: string;
}

export const BulkSendProgressComponent: React.FC<BulkSendProgressProps> = ({
  progress,
  isPolling,
  error,
  className = ''
}) => {
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Erro ao consultar progresso</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">Carregando progresso...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'pending':
        return 'Aguardando início';
      case 'in_progress':
        return 'Enviando mensagens';
      case 'completed':
        return 'Envio concluído';
      case 'failed':
        return 'Falha no envio';
      default:
        return 'Status desconhecido';
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  // Categorizar contatos por status
  const pendingContacts = progress.queue.filter(contact => contact.status === 'pending');
  const inProgressContacts = progress.queue.filter(contact => contact.status === 'in_progress');
  const sentContacts = progress.queue.filter(contact => contact.status === 'sent');
  const failedContacts = progress.queue.filter(contact => contact.status === 'failed');

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{getStatusText()}</h3>
            <p className="text-sm text-gray-600">
              Iniciado às {formatTime(progress.startTime)}
              {progress.endTime && ` • Duração: ${formatDuration(progress.startTime, progress.endTime)}`}
              {isPolling && ' • Atualizando...'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {progress.progressPercentage}%
          </div>
          <div className="text-sm text-gray-600">
            {progress.sent + progress.failed} de {progress.total}
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progresso geral</span>
          <span>{progress.sent + progress.failed} / {progress.total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{progress.sent}</div>
          <div className="text-sm text-gray-600">Enviados</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
          <div className="text-sm text-gray-600">Falharam</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{progress.inProgress}</div>
          <div className="text-sm text-gray-600">Enviando</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{pendingContacts.length}</div>
          <div className="text-sm text-gray-600">Na fila</div>
        </div>
      </div>

      {/* Lista de contatos */}
      <div className="space-y-3">
        {/* Contatos sendo enviados */}
        {inProgressContacts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
              Enviando agora ({inProgressContacts.length})
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
              {inProgressContacts.slice(0, 5).map((contact, index) => (
                <div key={contact.customerId} className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium">{contact.customerPhoneNumber}</span>
                </div>
              ))}
              {inProgressContacts.length > 5 && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  +{inProgressContacts.length - 5} contatos...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contatos enviados com sucesso */}
        {sentContacts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Enviados com sucesso ({sentContacts.length})
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
              {sentContacts.slice(0, 5).map((contact, index) => (
                <div key={contact.customerId} className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium">{contact.customerPhoneNumber}</span>
                  <CheckCircle className="h-3 w-3 text-green-600 inline ml-2" />
                </div>
              ))}
              {sentContacts.length > 5 && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  +{sentContacts.length - 5} contatos...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contatos que falharam */}
        {failedContacts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <XCircle className="h-4 w-4 text-red-600 mr-2" />
              Falhas no envio ({failedContacts.length})
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
              {failedContacts.slice(0, 5).map((contact, index) => (
                <div key={contact.customerId} className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{contact.customerPhoneNumber}</span>
                    <XCircle className="h-3 w-3 text-red-600" />
                  </div>
                  {contact.error && (
                    <div className="text-xs text-red-600 mt-1">{contact.error}</div>
                  )}
                </div>
              ))}
              {failedContacts.length > 5 && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  +{failedContacts.length - 5} contatos...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contatos na fila */}
        {pendingContacts.length > 0 && progress.status === 'in_progress' && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Clock className="h-4 w-4 text-yellow-600 mr-2" />
              Na fila de envio ({pendingContacts.length})
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
              {pendingContacts.slice(0, 5).map((contact, index) => (
                <div key={contact.customerId} className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium">{contact.customerPhoneNumber}</span>
                  <Clock className="h-3 w-3 text-yellow-600 inline ml-2" />
                </div>
              ))}
              {pendingContacts.length > 5 && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  +{pendingContacts.length - 5} contatos...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 