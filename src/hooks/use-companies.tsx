import { useAuth } from '@/contexts/AuthContext';
import { companiesService } from '@/services';
import { Company } from '@/services/companies';
import { useEffect, useState } from 'react';

// Interface para empresas com clinicId
interface CompanyWithClinicId extends Company {
  clinicId?: string;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Só busca empresas se o usuário estiver autenticado
    if (isAuthenticated) {
      fetchCompanies();
    } else {
      // Se não está autenticado, zera o estado
      setCompanies([]);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companiesService.getUserCompanies();
      
      console.log('Dados recebidos em useCompanies:', data);
      
      // Garantir que data é um array
      if (Array.isArray(data)) {
        // Verificar se todos os itens têm um ID válido
        const hasInvalidCompany = data.some(company => !company.id);
        if (hasInvalidCompany) {
          console.warn('Algumas empresas não têm ID válido:', 
            data.filter(company => !company.id)
          );
        }
        
        // Verificar se alguma empresa tem clinicId
        const hasClinicId = data.some(
          company => Boolean((company as CompanyWithClinicId).clinicId)
        );
        
        console.log('useCompanies: Empresas têm clinicId?', hasClinicId);
        
        setCompanies(data);
      } else {
        console.error('Dados recebidos não são um array:', data);
        setCompanies([]);
        setError('Formato de dados inválido recebido do servidor');
      }
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
      setCompanies([]);
      setError('Não foi possível carregar suas empresas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Recarrega as empresas manualmente
  const refetchCompanies = () => {
    fetchCompanies();
  };

  return {
    companies,
    loading,
    error,
    refetchCompanies,
  };
} 