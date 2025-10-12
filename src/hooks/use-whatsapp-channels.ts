import { channelsService, WhatsappChannel } from '@/services/channels';
import { useEffect, useState } from 'react';

export function useWhatsappChannels(clinicId?: string) {
  const [channels, setChannels] = useState<WhatsappChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setChannels([]);
      return;
    }

    const fetchChannels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedChannels = await channelsService.getWhatsappChannelsByClinicId(clinicId);
        setChannels(fetchedChannels);
      } catch (err) {
        console.error('Error fetching WhatsApp channels:', err);
        setError('Erro ao buscar canais WhatsApp');
        setChannels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, [clinicId]);

  return { channels, isLoading, error };
}