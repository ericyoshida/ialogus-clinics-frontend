import { clinicsService } from '@/services';
import { Clinic } from '@/services/clinics';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface ClinicContextType {
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  selectedClinicId: string | undefined;
  isLoading: boolean;
  error: string | null;
  setSelectedClinicId: (id: string) => void;
  refreshClinics: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};

interface ClinicProviderProps {
  children: ReactNode;
}

export function ClinicProvider({ children }: ClinicProviderProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>();
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshClinics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedClinics = await clinicsService.getUserClinics();
      
      setClinics(fetchedClinics);
      
      // If we don't have a selected clinic yet, select the first one
      if (!selectedClinicId && fetchedClinics.length > 0) {
        setSelectedClinicId(fetchedClinics[0].id);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setError('Failed to load clinics. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch clinics on mount
  useEffect(() => {
    refreshClinics();
  }, []);

  // Update selected clinic when the ID changes
  useEffect(() => {
    if (selectedClinicId && clinics.length > 0) {
      const clinic = clinics.find(c => c.id === selectedClinicId) || null;
      setSelectedClinic(clinic);
    } else {
      setSelectedClinic(null);
    }
  }, [selectedClinicId, clinics]);

  return (
    <ClinicContext.Provider
      value={{
        clinics,
        selectedClinic,
        selectedClinicId,
        isLoading,
        error,
        setSelectedClinicId,
        refreshClinics,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
} 