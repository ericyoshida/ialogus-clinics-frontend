import api from './api';

interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
      details?: string;
    };
  };
}

export interface Customer {
  id: string;
  name: string;
  department?: string;
  phoneNumber: string;
  customerReferenceId?: string;
  hasActiveWhatsappServiceWindow: boolean;
  whatsappServiceWindowStartedAt: string;
  whatsappServiceWindowExpiresAt: string;
  createdAt: string;
  updatedAt: string;
  lastMessageDate: string;
  lastChatLogStatus: 'active' | 'waiting_response' | 'inactive';
}

export interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export interface CustomersResponse {
  customers: Customer[];
  pagination?: PaginationInfo;
}

// Interface para a resposta da API do backend (usa "patients" e "patientReferenceId")
interface BackendPatient {
  id: string;
  name: string;
  phoneNumber: string;
  patientReferenceId?: string;
  hasActiveWhatsappServiceWindow: boolean;
  whatsappServiceWindowStartedAt: string;
  whatsappServiceWindowExpiresAt: string;
  createdAt: string;
  updatedAt: string;
  lastMessageDate: string;
  lastChatLogStatus: 'active' | 'waiting_response' | 'inactive';
}

interface BackendPatientsResponse {
  patients: BackendPatient[];
  pagination?: PaginationInfo;
}

// Função auxiliar para transformar dados do backend para o formato do frontend
function transformBackendPatientToCustomer(patient: BackendPatient): Customer {
  return {
    ...patient,
    customerReferenceId: patient.patientReferenceId,
    department: undefined, // Campo não existe no backend
  };
}

export interface CustomersFilters {
  name?: string;
  phoneNumber?: string;
  lastChatLogStatus?: 'active' | 'waiting_response' | 'inactive';
  page?: number;
  perPage?: number;
}

export const customersService = {
  async getCustomers(clinicId: string, filters?: CustomersFilters): Promise<CustomersResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.name) {
        params.append('name', filters.name);
      }
      
      if (filters?.phoneNumber) {
        params.append('phoneNumber', filters.phoneNumber);
      }
      
      if (filters?.lastChatLogStatus) {
        params.append('lastChatLogStatus', filters.lastChatLogStatus);
      }
      
      if (filters?.page) {
        params.append('page', filters.page.toString());
      }
      
      if (filters?.perPage) {
        params.append('perPage', filters.perPage.toString());
      }
      
      const queryString = params.toString();
      const url = `/clinics/${clinicId}/patients${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<BackendPatientsResponse>(url);

      // Transformar a resposta do backend para o formato esperado pelo frontend
      return {
        customers: response.data.patients.map(transformBackendPatientToCustomer),
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  },

  async createCustomer(clinicId: string, customerData: {
    name: string;
    phoneNumber: string;
    department?: string;
  }): Promise<Customer> {
    try {
      // O backend não aceita o campo 'department', então enviamos apenas name e phoneNumber
      const payload = {
        name: customerData.name,
        phoneNumber: customerData.phoneNumber.replace(/^\+/, ''),
      };

      console.log('Dados enviados para criação:', payload);

      const response = await api.post<BackendPatient>(`/clinics/${clinicId}/patients`, payload);

      // Transformar a resposta do backend para o formato do frontend
      return transformBackendPatientToCustomer(response.data);
    } catch (error: unknown) {
      console.error('Erro ao criar cliente:', error);
      console.log('Estrutura completa do erro:', JSON.stringify(error, null, 2));
      
      // Verifica se é o erro específico de contato já existente
      const apiError = error as ApiError;
      console.log('Status da resposta:', apiError.response?.status);
      console.log('Dados da resposta:', apiError.response?.data);
      
      if (apiError.response?.status === 400) {
        const errorData = apiError.response.data;
        if (errorData?.message === 'PATIENT_ALREADY_EXISTS') {
          throw new Error(errorData.details || 'Este número de telefone já está cadastrado para esta clínica.');
        }
        // Tratar outros erros 400
        if (errorData?.message) {
          throw new Error(`Erro de validação: ${errorData.message}`);
        }
      }
      
      // Se não conseguiu identificar o erro específico, relança o erro original
      throw error;
    }
  },

  async updateCustomer(customerId: string, customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'hasActiveWhatsappServiceWindow' | 'whatsappServiceWindowStartedAt' | 'whatsappServiceWindowExpiresAt' | 'lastMessageDate' | 'lastChatLogStatus'>): Promise<void> {
    try {
      // O backend não aceita 'department', então enviamos apenas os campos que ele espera
      const payload: {
        name: string;
        phoneNumber: string;
        patientReferenceId?: string;
      } = {
        name: customerData.name,
        phoneNumber: customerData.phoneNumber,
      };

      // Transformar customerReferenceId → patientReferenceId
      if (customerData.customerReferenceId) {
        payload.patientReferenceId = customerData.customerReferenceId;
      }

      console.log('Dados enviados para API:', payload);

      await api.put(`/patients/${customerId}`, payload);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await api.delete(`/patients/${customerId}`);
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  }
}; 