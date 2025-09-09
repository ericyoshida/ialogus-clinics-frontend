/**
 * Formata um número de telefone internacional para o formato brasileiro
 * Exemplo: 5511999998888 -> +55 (11) 99999-8888
 * Exemplo: 551334654420 -> +55 (13) 3465-4420
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Verificar se o phoneNumber existe e não é null/undefined
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return 'Telefone não disponível'; // Retorna placeholder quando telefone não está disponível
  }
  
  // Remove todos os caracteres não numéricos
  const cleaned = phoneNumber.replace(/[^\d]/g, '');
  
  // Verifica se é um número brasileiro que começa com 55
  if (cleaned.startsWith('55')) {
    // Número com 13 dígitos (celular): 5511999998888
    if (cleaned.length === 13) {
      const number = cleaned.substring(2); // Remove 55
      
      if (number.length === 11) {
        // Formato: +55 (XX) 9XXXX-XXXX
        const areaCode = number.substring(0, 2);
        const firstPart = number.substring(2, 7);
        const secondPart = number.substring(7);
        
        return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
      }
    }
    
    // Número com 12 dígitos (fixo): 551334654420
    if (cleaned.length === 12) {
      const number = cleaned.substring(2); // Remove 55
      
      if (number.length === 10) {
        // Formato: +55 (XX) XXXX-XXXX
        const areaCode = number.substring(0, 2);
        const firstPart = number.substring(2, 6);
        const secondPart = number.substring(6);
        
        return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
      }
    }
  }
  
  // Verifica se já tem o + no início
  if (phoneNumber.startsWith('+55')) {
    const cleanedWithPlus = phoneNumber.replace(/[^\d+]/g, '');
    const number = cleanedWithPlus.substring(3); // Remove +55
    
    if (number.length === 11) {
      // Formato: +55 (XX) 9XXXX-XXXX (celular)
      const areaCode = number.substring(0, 2);
      const firstPart = number.substring(2, 7);
      const secondPart = number.substring(7);
      
      return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
    } else if (number.length === 10) {
      // Formato: +55 (XX) XXXX-XXXX (fixo)
      const areaCode = number.substring(0, 2);
      const firstPart = number.substring(2, 6);
      const secondPart = number.substring(6);
      
      return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
    }
  }
  
  // Se não conseguir formatar, retorna o número original
  return phoneNumber;
}

/**
 * Formata a data da última mensagem
 * Retorna: "hoje às HHhMMm", "ontem às HHhMMm" ou "em DD/MM/AA às HHhMMm"
 */
export function formatLastMessageDate(dateString: string): string {
  const messageDate = new Date(dateString);
  const now = new Date();
  
  // Zera as horas para comparação de datas
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // Formata a hora
  const hours = messageDate.getHours().toString().padStart(2, '0');
  const minutes = messageDate.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}h${minutes}m`;
  
  if (messageDateOnly.getTime() === today.getTime()) {
    return `hoje às ${timeString}`;
  } else if (messageDateOnly.getTime() === yesterday.getTime()) {
    return `ontem às ${timeString}`;
  } else {
    // Formato DD/MM/AA
    const day = messageDate.getDate().toString().padStart(2, '0');
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
    const year = messageDate.getFullYear().toString().slice(-2);
    
    return `em ${day}/${month}/${year} às ${timeString}`;
  }
}

/**
 * Gera uma cor estável baseada no hash do nome
 * Retorna uma cor em formato hexadecimal
 */
export function generateStableColor(name: string): string {
  // Cores predefinidas para garantir boa legibilidade
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  // Gera um hash simples do nome
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para 32bit integer
  }
  
  // Usa o hash para selecionar uma cor
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

/**
 * Extrai as iniciais do nome
 * Exemplo: "João Silva Santos" -> "JS"
 */
export function getInitials(name: string): string {
  // Verificar se o nome existe e não é null/undefined
  if (!name || typeof name !== 'string') {
    return '??'; // Retorna placeholder quando nome não está disponível
  }
  
  const words = name.trim().split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  
  // Pega a primeira letra do primeiro nome e a primeira letra do último nome
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
  
  return firstInitial + lastInitial;
} 