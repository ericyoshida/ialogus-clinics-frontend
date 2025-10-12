/**
 * Retorna o ID da clínica selecionada no localStorage
 * @returns O ID da clínica ou null se não houver clínica selecionada
 */
export const getClinicIdFromLocalStorage = (): string | null => {
  return localStorage.getItem('temp_selected_clinic') || localStorage.getItem('selectedClinicId');
};

/**
 * Salva o ID da clínica no localStorage
 * @param clinicId ID da clínica a ser salvo
 * @param temporary Se true, salva como temporário (para fluxo de criação de agentes)
 */
export const saveClinicIdToLocalStorage = (clinicId: string, temporary = false): void => {
  if (temporary) {
    localStorage.setItem('temp_selected_clinic', clinicId);
  } else {
    localStorage.setItem('selectedClinicId', clinicId);
  }
};

/**
 * Remove o ID da clínica do localStorage
 * @param temporary Se true, remove apenas o ID temporário
 */
export const removeClinicIdFromLocalStorage = (temporary = false): void => {
  if (temporary) {
    localStorage.removeItem('temp_selected_clinic');
  } else {
    localStorage.removeItem('selectedClinicId');
    // Também remove o temporário para garantir consistência
    localStorage.removeItem('temp_selected_clinic');
  }
}; 