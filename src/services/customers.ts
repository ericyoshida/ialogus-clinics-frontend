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
      const url = `/seller-companies/${clinicId}/customers${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<CustomersResponse>(url);
      return response.data;
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
      const payload: {
        name: string;
        phoneNumber: string;
        department?: string;
      } = {
        name: customerData.name,
        phoneNumber: customerData.phoneNumber.replace(/^\+/, ''),
      };
      
      // Incluir department apenas se preenchido - undefined se vazio (para corresponder ao schema do backend)
      if (customerData.department && customerData.department.trim()) {
        payload.department = customerData.department.trim();
      }
      // Se vazio, não incluir o campo (será undefined)
      
      console.log('Dados enviados para criação:', payload);
      
      const response = await api.post<Customer>(`/seller-companies/${clinicId}/customers`, payload);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao criar cliente:', error);
      console.log('Estrutura completa do erro:', JSON.stringify(error, null, 2));
      
      // Verifica se é o erro específico de contato já existente
      const apiError = error as ApiError;
      console.log('Status da resposta:', apiError.response?.status);
      console.log('Dados da resposta:', apiError.response?.data);
      
      if (apiError.response?.status === 400) {
        const errorData = apiError.response.data;
        if (errorData?.message === 'CUSTOMER_ALREADY_EXISTS') {
          throw new Error(errorData.details || 'Este número de telefone já está cadastrado para esta empresa.');
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
      const payload: {
        name: string;
        phoneNumber: string;
        department?: string | null;
        customerReferenceId?: string;
      } = {
        name: customerData.name,
        phoneNumber: customerData.phoneNumber,
      };
      
      // Sempre incluir department - null se vazio, string se preenchido
      if (customerData.department && customerData.department.trim()) {
        payload.department = customerData.department.trim();
      } else {
        payload.department = null;
      }
      
      // Adicionar customerReferenceId apenas se existir
      if (customerData.customerReferenceId) {
        payload.customerReferenceId = customerData.customerReferenceId;
      }
      
      console.log('Dados enviados para API:', payload);
      
      await api.put(`/customers/${customerId}`, payload);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await api.delete(`/customers/${customerId}`);
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  }
}; 