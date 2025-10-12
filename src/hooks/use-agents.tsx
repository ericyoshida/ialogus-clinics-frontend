import { useAuth } from '@/contexts/AuthContext';
import { agentsService, authService } from '@/services';
import { Agent } from '@/services/agents';
import { useEffect, useState } from 'react';

export function useAgents(clinicId?: string) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Verificar se o userId está disponível no localStorage
    const hasUserId = authService.hasUserId();
    console.log('useAgents: userId disponível?', hasUserId);
    
    // Só busca agentes se o usuário estiver autenticado, tiver um clinicId e o userId estiver disponível
    if (isAuthenticated && clinicId && hasUserId) {
      fetchAgents(clinicId);
    } else {
      // Se não está autenticado ou não tem clinicId, zera o estado
      setAgents([]);
      setLoading(false);
      // Define a mensagem de erro apropriada
      if (!isAuthenticated) {
        setError('Usuário não autenticado');
      } else if (!clinicId) {
        setError('Selecione uma clínica para visualizar os agentes');
      } else if (!hasUserId) {
        setError('ID do usuário não encontrado. Faça login novamente.');
      } else {
        setError(null);
      }
    }
  }, [isAuthenticated, clinicId]);

  const fetchAgents = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se userId existe antes de fazer a chamada
      if (!authService.hasUserId()) {
        throw new Error('Usuário não autenticado ou ID do usuário não encontrado');
      }
      
      console.log(`Buscando agentes para clínica ${id} usando userId ${authService.getUserId()}`);
      const data = await agentsService.getClinicAgents(id);
      
      console.log('Dados recebidos em useAgents:', data);
      
      // Definir agents com o array recebido (que já foi processado no serviço)
      setAgents(data || []);
      
      // Informar quando não há agentes
      if (data.length === 0) {
        console.log('Nenhum agente encontrado para esta clínica');
      } else {
        console.log(`${data.length} agentes encontrados`);
      }
    } catch (err) {
      console.error('Erro ao buscar agentes:', err);
      setAgents([]);
      
      // Determinar a mensagem de erro apropriada
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Não foi possível carregar os agentes. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Recarrega os agentes manualmente
  const refetchAgents = (id?: string) => {
    // Verificar se userId existe antes de tentar refetch
    if (!authService.hasUserId()) {
      setError('ID do usuário não encontrado. Faça login novamente.');
      return;
    }
    
    if (id || clinicId) {
      fetchAgents(id || clinicId as string);
    }
  };

  return {
    agents,
    loading,
    error,
    refetchAgents,
  };
} 