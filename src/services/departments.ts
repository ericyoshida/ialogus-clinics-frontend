import { api } from '.';

export interface Department {
  id: string;
  departmentName: string;
  macroDepartmentName: string;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cria um novo departamento
 * @param clinicId ID da empresa
 * @param data Dados do departamento
 * @returns Departamento criado
 */
export const createDepartment = async (clinicId: string, data: {
  departmentName: string;
  macroDepartmentName: string;
}): Promise<Department> => {
  try {
    console.log(`Criando departamento para a empresa ${clinicId}...`);
    console.log('Dados:', data);
    
    const response = await api.post(`/seller-companies/${clinicId}/departments`, data);
    console.log('Departamento criado com sucesso:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao criar departamento:`, error);
    if (error.response) {
      console.error('Resposta do erro:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    throw error;
  }
};

export const departmentsService = {
  createDepartment,
};