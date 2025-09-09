import { useAuth } from '@/contexts/AuthContext'
import { channelsService, WhatsappChannel } from '@/services/channels'
import { useEffect, useState } from 'react'

export function useChannels(companyId?: string) {
  const [channels, setChannels] = useState<WhatsappChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && companyId) {
      fetchChannels(companyId);
    } else {
      setChannels([]);
      setLoading(false);
      
      if (!isAuthenticated) {
        setError('Usuário não autenticado');
      } else if (!companyId) {
        setError('Selecione uma empresa para visualizar os canais');
      } else {
        setError(null);
      }
    }
  }, [isAuthenticated, companyId]);

  const fetchChannels = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Buscando canais para empresa ${id}`);
      const data = await channelsService.getWhatsappChannelsByCompanyId(id);
      
      console.log('Dados recebidos em useChannels:', data);
      
      setChannels(data || []);
      
      if (data.length === 0) {
        console.log('Nenhum canal encontrado para esta empresa');
      } else {
        console.log(`${data.length} canais encontrados`);
      }
    } catch (err) {
      console.error('Erro ao buscar canais:', err);
      setChannels([]);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Não foi possível carregar os canais. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const refetchChannels = (id?: string) => {
    if (id || companyId) {
      fetchChannels(id || companyId as string);
    }
  };

  return {
    channels,
    loading,
    error,
    refetchChannels,
  };
}