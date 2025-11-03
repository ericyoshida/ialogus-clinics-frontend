import { bulkMessagesService, BulkSendProgress } from '@/services/bulkMessages';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseBulkSendProgressProps {
  agentId: string;
  whatsappChannelId: string;
  whatsappMessageTemplateId: string;
  jobId?: string;
  pollingInterval?: number; // em milissegundos, padrão 2000ms (2s)
  autoStop?: boolean; // para automaticamente quando completo/falhou
}

interface UseBulkSendProgressReturn {
  progress: BulkSendProgress | null;
  isPolling: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
  refreshProgress: () => Promise<void>;
}

export const useBulkSendProgress = ({
  agentId,
  whatsappChannelId,
  whatsappMessageTemplateId,
  jobId,
  pollingInterval = 2000,
  autoStop = true
}: UseBulkSendProgressProps): UseBulkSendProgressReturn => {
  const [progress, setProgress] = useState<BulkSendProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);
  const hasJobCompleted = useRef(false); // Nova flag para controlar se o job já foi finalizado

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Função para consultar o progresso
  const refreshProgress = useCallback(async () => {
    if (!jobId || !isComponentMounted.current || hasJobCompleted.current) return;

    try {
      console.log(`[useBulkSendProgress] Consultando progresso do job: ${jobId}`);
      
      const progressData = await bulkMessagesService.getBulkSendProgress(
        agentId,
        whatsappChannelId,
        whatsappMessageTemplateId,
        jobId
      );

      if (!isComponentMounted.current) return;

      setProgress(progressData);
      setError(null);

      // Parar polling automaticamente se o job foi completado ou falhou
      if (autoStop && (progressData.status === 'completed' || progressData.status === 'failed')) {
        console.log(`[useBulkSendProgress] Job ${jobId} finalizado com status: ${progressData.status} - PARANDO POLLING`);
        hasJobCompleted.current = true; // Marcar como completado
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

    } catch (err) {
      console.error(`[useBulkSendProgress] Erro ao consultar progresso:`, err);
      
      if (!isComponentMounted.current) return;
      
      setError(err instanceof Error ? err.message : 'Erro ao consultar progresso');
      
      // Se houver erro, parar o polling
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [jobId, agentId, whatsappChannelId, whatsappMessageTemplateId, autoStop]);

  // Função para iniciar o polling
  const startPolling = useCallback(() => {
    if (!jobId || isPolling || hasJobCompleted.current) {
      console.log(`[useBulkSendProgress] Polling não iniciado - jobId: ${jobId}, isPolling: ${isPolling}, hasCompleted: ${hasJobCompleted.current}`);
      return;
    }

    console.log(`[useBulkSendProgress] Iniciando polling para job: ${jobId}`);
    
    setIsPolling(true);
    setError(null);
    
    // Primeira consulta imediata
    refreshProgress();
    
    // Configurar polling apenas se ainda não completou
    if (!hasJobCompleted.current) {
      intervalRef.current = setInterval(() => {
        if (!hasJobCompleted.current) {
          refreshProgress();
        }
      }, pollingInterval);
    }
    
  }, [jobId, isPolling, pollingInterval, refreshProgress]);

  // Função para parar o polling
  const stopPolling = useCallback(() => {
    console.log(`[useBulkSendProgress] Parando polling para job: ${jobId}`);
    
    setIsPolling(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [jobId]);

  // Auto-iniciar polling quando jobId muda (mas apenas se não completou ainda)
  useEffect(() => {
    if (jobId) {
      // Reset da flag quando jobId muda (novo job)
      hasJobCompleted.current = false;
      
      if (!isPolling) {
        startPolling();
      }
    }
  }, [jobId, startPolling]);

  // Limpar polling quando component desmonta ou jobId muda
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId]);

  return {
    progress,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refreshProgress
  };
}; 