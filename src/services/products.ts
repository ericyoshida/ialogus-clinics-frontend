import api from './api';

export interface ServiceProviderCalendar {
  serviceProviderCalendarId: string;
  membershipId: string;
  userName: string;
  googleCalendarId?: string | null;
}

export interface Product {
  productId: string;
  productName: string;
  productDescription: string;
  productPrice: string | number;
  serviceProviderCalendars: ServiceProviderCalendar[];
  createdAt?: string;
  updatedAt?: string | null;
}

export interface ProductsList {
  productsListId: string;
  productsListName: string;
  products: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListsResponse {
  productsLists: ProductsList[];
}

export interface ProductsResponse {
  products: Product[];
}

export interface Calendar {
  calendarId: string;
  membershipId: string;
  user: {
    name: string;
  };
  googleCalendarId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarsResponse {
  calendars: Calendar[];
}

export interface CreateProductRequest {
  name: string;
  description: string;
  listPrice: string;
  serviceProviderCalendarIds: string[];
}

export interface CreateProductsListRequest {
  name: string;
  productsIds: string[];
}

export interface EditProductRequest {
  name: string;
  description: string;
  listPrice: string;
  serviceProviderCalendarIds: string[];
}

export interface EditProductsListRequest {
  name: string;
  description: string;
  productsIds: string[];
}

/**
 * Busca as listas de produtos de uma empresa
 * @param clinicId ID da empresa
 * @returns Lista de catálogos de produtos
 */
export const getProductsLists = async (clinicId: string): Promise<ProductsList[]> => {
  try {
    console.log(`Buscando catálogos de produtos para a empresa ${clinicId}...`);
    const response = await api.get<ProductsListsResponse>(`/seller-companies/${clinicId}/products-lists`);
    
    // Log da resposta para debug
    console.log('Resposta da API (products-lists):', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.productsLists) {
      return response.data.productsLists;
    }
    
    // Caso não tenha a propriedade esperada, retorna array vazio
    console.warn('Resposta da API não contém productsLists:', response.data);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar catálogos de produtos para a empresa ${clinicId}:`, error);
    throw error;
  }
};

/**
 * Busca uma lista de produtos específica
 * @param clinicId ID da empresa
 * @param productsListId ID da lista de produtos
 * @returns Detalhes da lista de produtos
 */
export const getProductsListDetails = async (
  clinicId: string, 
  productsListId: string
): Promise<ProductsList | null> => {
  try {
    console.log(`Buscando detalhes do catálogo ${productsListId} para a empresa ${clinicId}...`);
    const response = await api.get<ProductsList>(
      `/seller-companies/${clinicId}/products-lists/${productsListId}`
    );
    
    console.log('Detalhes do catálogo recebidos:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do catálogo ${productsListId}:`, error);
    return null;
  }
};

/**
 * Busca todos os produtos de uma empresa
 * @param clinicId ID da empresa
 * @returns Lista de produtos
 */
export const getCompanyProducts = async (clinicId: string): Promise<Product[]> => {
  try {
    console.log(`Buscando produtos para a empresa ${clinicId}...`);
    const response = await api.get<ProductsResponse>(`/seller-companies/${clinicId}/products`);
    
    // Log da resposta para debug
    console.log('Resposta da API (products):', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.products) {
      return response.data.products;
    }
    
    // Caso não tenha a propriedade esperada, retorna array vazio
    console.warn('Resposta da API não contém products:', response.data);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar produtos para a empresa ${clinicId}:`, error);
    throw error;
  }
};

/**
 * Busca todos os calendários dos prestadores de serviço de uma empresa
 * @param clinicId ID da empresa
 * @returns Lista de calendários
 */
export const getCompanyCalendars = async (clinicId: string): Promise<Calendar[]> => {
  try {
    console.log(`Buscando calendários para a empresa ${clinicId}...`);
    const response = await api.get<CalendarsResponse>(`/seller-companies/${clinicId}/calendars`);
    
    // Log da resposta para debug
    console.log('Resposta da API (calendars):', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.calendars) {
      return response.data.calendars;
    }
    
    // Caso não tenha a propriedade esperada, retorna array vazio
    console.warn('Resposta da API não contém calendars:', response.data);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar calendários para a empresa ${clinicId}:`, error);
    throw error;
  }
};

/**
 * Cria um novo produto para uma empresa
 * @param clinicId ID da empresa
 * @param productData Dados do produto a ser criado
 * @returns O produto criado
 */
export const createProduct = async (
  clinicId: string,
  productData: CreateProductRequest
): Promise<Product> => {
  try {
    console.log(`Criando produto para a empresa ${clinicId}...`, productData);
    const response = await api.post<Product>(
      `/seller-companies/${clinicId}/products`,
      productData
    );
    
    console.log('Produto criado:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao criar produto para a empresa ${clinicId}:`, error);
    throw error;
  }
};

/**
 * Cria uma nova lista de produtos para uma empresa
 * @param clinicId ID da empresa
 * @param productsListData Dados da lista de produtos a ser criada
 * @returns A lista de produtos criada
 */
export const createProductsList = async (
  clinicId: string,
  productsListData: CreateProductsListRequest
): Promise<ProductsList> => {
  try {
    console.log(`Criando lista de produtos para a empresa ${clinicId}...`, productsListData);
    const response = await api.post<ProductsList>(
      `/seller-companies/${clinicId}/products-lists`,
      productsListData
    );
    
    console.log('Lista de produtos criada:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao criar lista de produtos para a empresa ${clinicId}:`, error);
    throw error;
  }
};

/**
 * Edita um produto existente
 * @param productId ID do produto
 * @param productData Dados do produto a ser editado
 * @returns O produto editado
 */
export const editProduct = async (
  productId: string,
  productData: EditProductRequest
): Promise<void> => {
  try {
    console.log(`Editando produto ${productId}...`, productData);
    await api.put(`/products/${productId}`, productData);
    console.log('Produto editado com sucesso');
  } catch (error) {
    console.error(`Erro ao editar produto ${productId}:`, error);
    throw error;
  }
};

/**
 * Deleta um produto
 * @param productId ID do produto a ser deletado
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    console.log(`Deletando produto ${productId}...`);
    await api.delete(`/products/${productId}`);
    console.log('Produto deletado com sucesso');
  } catch (error) {
    console.error(`Erro ao deletar produto ${productId}:`, error);
    throw error;
  }
};

/**
 * Edita uma lista de produtos existente
 * @param productsListId ID da lista de produtos
 * @param productsListData Dados da lista de produtos a ser editada
 * @returns A lista de produtos editada
 */
export const editProductsList = async (
  productsListId: string,
  productsListData: EditProductsListRequest
): Promise<void> => {
  try {
    console.log(`Editando lista de produtos ${productsListId}...`, productsListData);
    await api.put(`/products-lists/${productsListId}`, productsListData);
    console.log('Lista de produtos editada com sucesso');
  } catch (error) {
    console.error(`Erro ao editar lista de produtos ${productsListId}:`, error);
    throw error;
  }
};

/**
 * Deleta uma lista de produtos
 * @param productsListId ID da lista de produtos a ser deletada
 */
export const deleteProductsList = async (productsListId: string): Promise<void> => {
  try {
    console.log(`Deletando lista de produtos ${productsListId}...`);
    await api.delete(`/products-lists/${productsListId}`);
    console.log('Lista de produtos deletada com sucesso');
  } catch (error) {
    console.error(`Erro ao deletar lista de produtos ${productsListId}:`, error);
    throw error;
  }
}; 