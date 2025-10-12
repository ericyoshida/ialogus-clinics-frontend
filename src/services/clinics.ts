import { api } from '.';

export interface Department {
  departmentId: string;
  departmentName: string;
  macroDepartmentName: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  acceptedInsurances: string[];
  departments: Department[];
  createdAt: string;
  updatedAt: string;
}

interface ClinicsResponse {
  clinics: Clinic[];
}

export interface CreateClinicDto {
  name: string;
  address: string;
  acceptedInsurances: string[];
}

// Interface para representar os dados brutos que podem vir da API
interface RawClinicData {
  id?: string;
  _id?: string;
  clinicId?: string;
  id_clinic?: string;
  clinicId?: string;
  name: string;
  address?: string;
  acceptedInsurances?: string[];
  departments?: Department[];
  createdAt?: string;
  updatedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Busca as clínicas associadas ao usuário logado
 */
export const getUserClinics = async (): Promise<Clinic[]> => {
  try {
    console.log('Buscando clínicas do usuário...');
    const response = await api.get('/clinics');
    
    // Log da resposta completa para debug
    console.log('Resposta completa da API (clinics):', JSON.stringify(response.data, null, 2));
    
    // Verificar se a resposta tem a propriedade clinics
    if (response.data && response.data.clinics) {
      const rawClinics = response.data.clinics as RawClinicData[];
      
      // Garantir que cada clínica tenha um ID válido
      const clinics = rawClinics.map(clinic => {
        // Priorizar o uso de clinicId como identificador principal
        const clinicId = 
          clinic.clinicId || 
          clinic.id || 
          clinic._id || 
          clinic.id_clinic || 
          clinic.clinicId || 
          `clinic-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        if (!clinic.id) {
          console.log(`Ajustando clínica. Nome: ${clinic.name}, ID usado: ${clinicId}`);
        }
        
        return { ...clinic, id: clinicId } as Clinic;
      });
      
      console.log('Clínicas processadas:', clinics);
      return clinics;
    }
    
    // Se não tiver a propriedade esperada, mas for um array, retorna o array processado
    if (Array.isArray(response.data)) {
      const rawClinics = response.data as RawClinicData[];
      
      // Garantir que cada clínica tenha um ID válido
      const clinics = rawClinics.map((clinic, index) => {
        // Priorizar o uso de clinicId como identificador principal
        const clinicId = 
          clinic.clinicId || 
          clinic.id || 
          clinic._id || 
          clinic.id_clinic || 
          clinic.clinicId || 
          `clinic-${index}-${Date.now()}`;
        
        if (!clinic.id) {
          console.log(`Ajustando clínica no array. Nome: ${clinic.name}, ID usado: ${clinicId}`);
        }
        
        return { ...clinic, id: clinicId } as Clinic;
      });
      
      console.log('Clínicas processadas (array):', clinics);
      return clinics;
    }
    
    // Caso não seja nenhum dos casos acima, retorna um array vazio
    console.warn('Resposta da API não contém clinics nem é um array:', response.data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar clínicas do usuário:', error);
    throw error;
  }
};

/**
 * Busca uma clínica específica por ID
 */
export const getClinicById = async (id: string): Promise<Clinic | null> => {
  try {
    console.log(`Buscando clínica com ID ${id}...`);
    const response = await api.get(`/clinics/${id}`);
    console.log('Clínica recebida:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar clínica com ID ${id}:`, error);
    return null;
  }
};

export const createClinic = async (clinicData: CreateClinicDto): Promise<Clinic> => {
  try {
    const response = await api.post<Clinic>('/clinics', clinicData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar clínica:', error);
    throw error;
  }
};

/**
 * Edita uma clínica existente
 */
export const editClinic = async (clinicId: string, clinicData: CreateClinicDto): Promise<void> => {
  try {
    console.log(`Editando clínica com ID ${clinicId}...`, clinicData);
    await api.put(`/clinics/${clinicId}`, clinicData);
    console.log('Clínica editada com sucesso');
  } catch (error) {
    console.error(`Erro ao editar clínica com ID ${clinicId}:`, error);
    throw error;
  }
};

/**
 * Deleta uma clínica
 */
export const deleteClinic = async (clinicId: string): Promise<void> => {
  try {
    console.log(`Deletando clínica com ID ${clinicId}...`);
    await api.delete(`/clinics/${clinicId}`);
    console.log('Clínica deletada com sucesso');
  } catch (error) {
    console.error(`Erro ao deletar clínica com ID ${clinicId}:`, error);
    throw error;
  }
}; 