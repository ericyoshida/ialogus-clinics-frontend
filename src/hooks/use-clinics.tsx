import { useAuth } from '@/contexts/AuthContext';
import { clinicsService } from '@/services';
import { Clinic } from '@/services/clinics';
import { useEffect, useState } from 'react';

// Interface para clínicas com clinicId
interface ClinicWithClinicId extends Clinic {
  clinicId?: string;
}

export function useClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Só busca clínicas se o usuário estiver autenticado
    if (isAuthenticated) {
      fetchClinics();
    } else {
      // Se não está autenticado, zera o estado
      setClinics([]);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated]);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clinicsService.getUserClinics();
      
      console.log('Dados recebidos em useClinics:', data);
      
      // Garantir que data é um array
      if (Array.isArray(data)) {
        // Verificar se todos os itens têm um ID válido
        const hasInvalidClinic = data.some(clinic => !clinic.id);
        if (hasInvalidClinic) {
          console.warn('Algumas clínicas não têm ID válido:', 
            data.filter(clinic => !clinic.id)
          );
        }
        
        // Verificar se alguma clínica tem clinicId
        const hasClinicId = data.some(
          clinic => Boolean((clinic as ClinicWithClinicId).clinicId)
        );
        
        console.log('useClinics: Clínicas têm clinicId?', hasClinicId);
        
        setClinics(data);
      } else {
        console.error('Dados recebidos não são um array:', data);
        setClinics([]);
        setError('Formato de dados inválido recebido do servidor');
      }
    } catch (err) {
      console.error('Erro ao buscar clínicas:', err);
      setClinics([]);
      setError('Não foi possível carregar suas clínicas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Recarrega as clínicas manualmente
  const refetchClinics = () => {
    fetchClinics();
  };

  return {
    clinics,
    loading,
    error,
    refetchClinics,
  };
} 