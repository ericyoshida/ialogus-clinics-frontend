/**
 * Remove todos os caracteres não numéricos de uma string
 * @param phone - Número de telefone com formatação
 * @returns Apenas os dígitos do número
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formata um número de telefone para exibição
 * @param phone - Número de telefone apenas com dígitos
 * @returns Número formatado para exibição
 */
export function formatPhoneNumber(phone: string): string {
  // Remove não-dígitos por precaução
  const cleaned = phone.replace(/\D/g, '');
  
  // Se tem código do país (55 para Brasil)
  if (cleaned.length >= 12) {
    // +55 11 98765-4321
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, 9);
    const secondPart = cleaned.slice(9);
    return `+${countryCode} ${areaCode} ${firstPart}-${secondPart}`;
  }
  
  // Se não tem código do país mas tem DDD
  if (cleaned.length >= 10) {
    const areaCode = cleaned.slice(0, 2);
    const firstPart = cleaned.slice(2, 7);
    const secondPart = cleaned.slice(7);
    return `${areaCode} ${firstPart}-${secondPart}`;
  }
  
  // Retorna como está se não se encaixa em nenhum padrão
  return cleaned;
}

/**
 * Valida se um número de telefone tem formato válido
 * @param phone - Número de telefone (pode estar formatado)
 * @returns true se o número é válido
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Deve ter pelo menos 10 dígitos (DDD + número)
  // e no máximo 15 (padrão internacional)
  return cleaned.length >= 10 && cleaned.length <= 15;
}