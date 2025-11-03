import { Button } from '@/components/ui/button';
import { IalogusInput } from '@/components/ui/ialogus-input';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
}

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (customer: Customer) => void;
  isLoading?: boolean;
}

export function EditContactModal({ 
  isOpen, 
  onClose, 
  customer, 
  onSave, 
  isLoading = false 
}: EditContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    phoneNumber: ''
  });

  // Atualizar form quando customer mudar
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phoneNumber: customer.phoneNumber || ''
      });
      setErrors({ name: '', phoneNumber: '' });
    }
  }, [customer]);

  // Validação básica
  const validateForm = () => {
    const newErrors = { name: '', phoneNumber: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefone é obrigatório';
      isValid = false;
    } else {
      // Validação básica de telefone (apenas números, +, espaços, parênteses e hífens)
      const phoneRegex = /^[+\d\s()-]+$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Formato de telefone inválido';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !customer) return;

    const updatedCustomer: Customer = {
      ...customer,
      name: formData.name.trim(),
      phoneNumber: formData.phoneNumber.trim()
    };

    onSave(updatedCustomer);
  };

  const handleClose = () => {
    setFormData({ name: '', phoneNumber: '' });
    setErrors({ name: '', phoneNumber: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Editar Contato</h2>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <IalogusInput
              label="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome completo"
              errorMessage={errors.name}
              disabled={isLoading}
              required
            />
          </div>

          {/* Telefone */}
          <div>
            <IalogusInput
              label="Telefone"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="Digite o telefone"
              errorMessage={errors.phoneNumber}
              disabled={isLoading}
              required
            />
          </div>

          {/* Departamento (opcional) */}
          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-5 py-2 rounded-md text-white transition-colors h-10"
              style={{ 
                background: 'linear-gradient(90deg, #F6921E, #EE413D)'
              }}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 