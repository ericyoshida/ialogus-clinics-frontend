import { useEffect, useState } from 'react';

export interface BulkMessageFormData {
  selectedAgentId?: string;
  selectedAgentData?: {
    botModelId: string;
    departmentId: string;
    departmentName: string;
    botName: string;
    clinicId: string;
  };
  selectedChannelId?: string;
  selectedChannelData?: {
    id: string;
    botName: string;
    phoneNumber: string;
    operationalRegion: string;
  };
  selectedTemplateId?: string;
  selectedTemplateData?: {
    whatsappMessageTemplateId: string;
    whatsappChannelId: string;
    messageTemplateName: string;
  };
  selectedContacts?: string[];
  step?: number;
}

const STORAGE_KEY = 'bulk-message-form-data';

export function useBulkMessageForm() {
  const [formData, setFormData] = useState<BulkMessageFormData>({});

  // Carregar dados do localStorage quando o hook é inicializado
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Erro ao carregar dados do formulário:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Função para atualizar dados específicos
  const updateFormData = (updates: Partial<BulkMessageFormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  // Função para limpar todos os dados
  const clearFormData = () => {
    setFormData({});
    localStorage.removeItem(STORAGE_KEY);
  };

  // Função para obter dados específicos
  const getFormValue = <K extends keyof BulkMessageFormData>(key: K): BulkMessageFormData[K] => {
    return formData[key];
  };

  // Função para verificar se há dados salvos
  const hasData = () => {
    return Object.keys(formData).length > 0;
  };

  return {
    formData,
    updateFormData,
    clearFormData,
    getFormValue,
    hasData,
    selectedAgentId: formData.selectedAgentId,
    selectedAgentData: formData.selectedAgentData,
    selectedChannelId: formData.selectedChannelId,
    selectedChannelData: formData.selectedChannelData,
    selectedTemplateId: formData.selectedTemplateId,
    selectedTemplateData: formData.selectedTemplateData,
    selectedContacts: formData.selectedContacts,
    currentStep: formData.step || 0
  };
} 