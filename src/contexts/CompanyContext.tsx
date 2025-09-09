import { companiesService } from '@/services';
import { Company } from '@/services/companies';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  selectedCompanyId: string | undefined;
  isLoading: boolean;
  error: string | null;
  setSelectedCompanyId: (id: string) => void;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedCompanies = await companiesService.getUserCompanies();
      
      setCompanies(fetchedCompanies);
      
      // If we don't have a selected company yet, select the first one
      if (!selectedCompanyId && fetchedCompanies.length > 0) {
        setSelectedCompanyId(fetchedCompanies[0].id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to load companies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch companies on mount
  useEffect(() => {
    refreshCompanies();
  }, []);

  // Update selected company when the ID changes
  useEffect(() => {
    if (selectedCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === selectedCompanyId) || null;
      setSelectedCompany(company);
    } else {
      setSelectedCompany(null);
    }
  }, [selectedCompanyId, companies]);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        selectedCompanyId,
        isLoading,
        error,
        setSelectedCompanyId,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
} 