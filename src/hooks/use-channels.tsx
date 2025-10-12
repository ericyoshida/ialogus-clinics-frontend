import { useAuth } from '@/contexts/AuthContext';
import { channelsService, WhatsappChannel } from '@/services/channels';
import { useEffect, useState } from 'react';

export function useChannels(clinicId?: string) {
  const [channels, setChannels] = useState<WhatsappChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && clinicId) {
      fetchChannels(clinicId);
    } else {
      setChannels([]);
      setLoading(false);
      
      if (!isAuthenticated) {
        setError('Usuário não autenticado');
      } else if (!clinicId) {
        setError('Selecione uma clínica para visualizar os canais');
      } else {
        setError(null);
      }
    }
  }, [isAuthenticated, clinicId]);

  const fetchChannels = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Buscando canais para clínica ${id}`);
      const data = await channelsService.getWhatsappChannelsByClinicId(id);
      
      console.log('Dados recebidos em useChannels:', data);
      
      setChannels(data || []);
      
      if (data.length === 0) {
        console.log('Nenhum canal encontrado para esta clínica');
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
    if (id || clinicId) {
      fetchChannels(id || clinicId as string);
    }
  };

  return {
    channels,
    loading,
    error,
    refetchChannels,
  };
}