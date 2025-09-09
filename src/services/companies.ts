import { api } from '.';

export interface Department {
  departmentId: string;
  departmentName: string;
  macroDepartmentName: string;
}

export interface Company {
  id: string;
  name: string;
  shortName: string;
  brandDescription: string;
  businessDescription: string;
  departments: Department[];
  createdAt: string;
  updatedAt: string;
}

interface CompaniesResponse {
  sellerCompanies: Company[];
}

export interface CreateCompanyDto {
  name: string;
  shortName?: string;
  brandDescription: string;
  businessDescription: string;
}

// Interface para representar os dados brutos que podem vir da API
interface RawCompanyData {
  id?: string;
  _id?: string;
  clinicId?: string;
  id_company?: string;
  companyId?: string;
  name: string;
  shortName?: string;
  brandDescription?: string;
  businessDescription?: string;
  departments?: Department[];
  createdAt?: string;
  updatedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Busca as empresas associadas ao usuário logado
 */
export const getUserCompanies = async (): Promise<Company[]> => {
  try {
    console.log('Buscando empresas do usuário...');
    const response = await api.get('/seller-companies');
    
    // Log da resposta completa para debug
    console.log('Resposta completa da API (seller-companies):', JSON.stringify(response.data, null, 2));
    
    // Verificar se a resposta tem a propriedade sellerCompanies
    if (response.data && response.data.sellerCompanies) {
      const rawCompanies = response.data.sellerCompanies as RawCompanyData[];
      
      // Garantir que cada empresa tenha um ID válido
      const companies = rawCompanies.map(company => {
        // Priorizar o uso de clinicId como identificador principal
        const companyId = 
          company.clinicId || 
          company.id || 
          company._id || 
          company.id_company || 
          company.companyId || 
          `company-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        if (!company.id) {
          console.log(`Ajustando empresa. Nome: ${company.name}, ID usado: ${companyId}`);
        }
        
        return { ...company, id: companyId } as Company;
      });
      
      console.log('Empresas processadas:', companies);
      return companies;
    }
    
    // Se não tiver a propriedade esperada, mas for um array, retorna o array processado
    if (Array.isArray(response.data)) {
      const rawCompanies = response.data as RawCompanyData[];
      
      // Garantir que cada empresa tenha um ID válido
      const companies = rawCompanies.map((company, index) => {
        // Priorizar o uso de clinicId como identificador principal
        const companyId = 
          company.clinicId || 
          company.id || 
          company._id || 
          company.id_company || 
          company.companyId || 
          `company-${index}-${Date.now()}`;
        
        if (!company.id) {
          console.log(`Ajustando empresa no array. Nome: ${company.name}, ID usado: ${companyId}`);
        }
        
        return { ...company, id: companyId } as Company;
      });
      
      console.log('Empresas processadas (array):', companies);
      return companies;
    }
    
    // Caso não seja nenhum dos casos acima, retorna um array vazio
    console.warn('Resposta da API não contém sellerCompanies nem é um array:', response.data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar empresas do usuário:', error);
    throw error;
  }
};

/**
 * Busca uma empresa específica por ID
 */
export const getCompanyById = async (id: string): Promise<Company | null> => {
  try {
    console.log(`Buscando empresa com ID ${id}...`);
    const response = await api.get(`/seller-companies/${id}`);
    console.log('Empresa recebida:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar empresa com ID ${id}:`, error);
    return null;
  }
};

export const createCompany = async (companyData: CreateCompanyDto): Promise<Company> => {
  try {
    const response = await api.post<Company>('/seller-companies', companyData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    throw error;
  }
};

/**
 * Edita uma empresa existente
 */
export const editCompany = async (companyId: string, companyData: CreateCompanyDto): Promise<void> => {
  try {
    console.log(`Editando empresa com ID ${companyId}...`, companyData);
    await api.put(`/seller-companies/${companyId}`, companyData);
    console.log('Empresa editada com sucesso');
  } catch (error) {
    console.error(`Erro ao editar empresa com ID ${companyId}:`, error);
    throw error;
  }
};

/**
 * Deleta uma empresa
 */
export const deleteCompany = async (companyId: string): Promise<void> => {
  try {
    console.log(`Deletando empresa com ID ${companyId}...`);
    await api.delete(`/seller-companies/${companyId}`);
    console.log('Empresa deletada com sucesso');
  } catch (error) {
    console.error(`Erro ao deletar empresa com ID ${companyId}:`, error);
    throw error;
  }
}; 