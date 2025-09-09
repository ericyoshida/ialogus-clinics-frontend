/**
 * Retorna o ID da empresa selecionada no localStorage
 * @returns O ID da empresa ou null se não houver empresa selecionada
 */
export const getCompanyIdFromLocalStorage = (): string | null => {
  return localStorage.getItem('temp_selected_company') || localStorage.getItem('selectedCompanyId');
};

/**
 * Salva o ID da empresa no localStorage
 * @param companyId ID da empresa a ser salvo
 * @param temporary Se true, salva como temporário (para fluxo de criação de agentes)
 */
export const saveCompanyIdToLocalStorage = (companyId: string, temporary = false): void => {
  if (temporary) {
    localStorage.setItem('temp_selected_company', companyId);
  } else {
    localStorage.setItem('selectedCompanyId', companyId);
  }
};

/**
 * Remove o ID da empresa do localStorage
 * @param temporary Se true, remove apenas o ID temporário
 */
export const removeCompanyIdFromLocalStorage = (temporary = false): void => {
  if (temporary) {
    localStorage.removeItem('temp_selected_company');
  } else {
    localStorage.removeItem('selectedCompanyId');
    // Também remove o temporário para garantir consistência
    localStorage.removeItem('temp_selected_company');
  }
}; 