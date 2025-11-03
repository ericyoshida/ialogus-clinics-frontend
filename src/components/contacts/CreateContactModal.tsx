import { IalogusInput } from '@/components/ui/ialogus-input'
import { X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: {
    name: string;
    phoneNumber: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const COUNTRY_CODES = [
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+1', country: 'Canadá', flag: '🇨🇦' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
  { code: '+33', country: 'França', flag: '🇫🇷' },
  { code: '+39', country: 'Itália', flag: '🇮🇹' },
  { code: '+34', country: 'Espanha', flag: '🇪🇸' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colômbia', flag: '🇨🇴' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+598', country: 'Uruguai', flag: '🇺🇾' },
  { code: '+595', country: 'Paraguai', flag: '🇵🇾' },
  { code: '+591', country: 'Bolívia', flag: '🇧🇴' },
  { code: '+593', country: 'Equador', flag: '🇪🇨' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+81', country: 'Japão', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+82', country: 'Coreia do Sul', flag: '🇰🇷' },
  { code: '+91', country: 'Índia', flag: '🇮🇳' },
  { code: '+61', country: 'Austrália', flag: '🇦🇺' },
  { code: '+64', country: 'Nova Zelândia', flag: '🇳🇿' },
  { code: '+27', country: 'África do Sul', flag: '🇿🇦' },
  { code: '+234', country: 'Nigéria', flag: '🇳🇬' },
  { code: '+20', country: 'Egito', flag: '🇪🇬' },
  { code: '+971', country: 'Emirados Árabes Unidos', flag: '🇦🇪' },
  { code: '+966', country: 'Arábia Saudita', flag: '🇸🇦' },
  { code: '+7', country: 'Rússia', flag: '🇷🇺' },
  { code: '+31', country: 'Holanda', flag: '🇳🇱' },
  { code: '+32', country: 'Bélgica', flag: '🇧🇪' },
  { code: '+41', country: 'Suíça', flag: '🇨🇭' },
  { code: '+43', country: 'Áustria', flag: '🇦🇹' },
  { code: '+46', country: 'Suécia', flag: '🇸🇪' },
  { code: '+47', country: 'Noruega', flag: '🇳🇴' },
  { code: '+45', country: 'Dinamarca', flag: '🇩🇰' },
  { code: '+358', country: 'Finlândia', flag: '🇫🇮' },
  { code: '+48', country: 'Polônia', flag: '🇵🇱' },
  { code: '+420', country: 'República Tcheca', flag: '🇨🇿' },
  { code: '+36', country: 'Hungria', flag: '🇭🇺' },
  { code: '+30', country: 'Grécia', flag: '🇬🇷' },
  { code: '+90', country: 'Turquia', flag: '🇹🇷' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+65', country: 'Singapura', flag: '🇸🇬' },
  { code: '+60', country: 'Malásia', flag: '🇲🇾' },
  { code: '+66', country: 'Tailândia', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnã', flag: '🇻🇳' },
  { code: '+63', country: 'Filipinas', flag: '🇵🇭' },
  { code: '+62', country: 'Indonésia', flag: '🇮🇩' },
];

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+55'); // Default Brasil
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    phoneNumber?: string;
  }>({});

  // Resetar formulário quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCountryCode('+55');
      setPhoneNumber('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: { name?: string; phoneNumber?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefone é obrigatório';
    } else {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (countryCode === '+55' && !/^\d{10,11}$/.test(digitsOnly)) {
        newErrors.phoneNumber = 'Telefone deve ter 10 ou 11 dígitos';
      } else if (countryCode !== '+55' && digitsOnly.length < 7) {
        newErrors.phoneNumber = 'Número de telefone inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      // Limpar completamente o número de telefone antes de enviar
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const fullPhoneNumber = countryCode + cleanPhoneNumber;

      console.log('Dados sendo enviados:', {
        name: name.trim(),
        phoneNumber: fullPhoneNumber
      });

      await onSave({
        name: name.trim(),
        phoneNumber: fullPhoneNumber
      });
      
      // Só fecha o modal se não houve erro
      onClose();
    } catch (error) {
      console.error('Erro ao criar contato no modal:', error);
      // NÃO fecha o modal quando há erro - deixa o erro ser exibido via toast
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove tudo que não é dígito
    const digitsOnly = value.replace(/\D/g, '');
    
    // Aplica formatação baseada no país
    let formatted = digitsOnly;
    if (countryCode === '+55') {
      // Formatação brasileira
      if (digitsOnly.length >= 2) {
        formatted = `(${digitsOnly.slice(0, 2)}) `;
        if (digitsOnly.length >= 7) {
          formatted += `${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7, 11)}`;
        } else if (digitsOnly.length > 2) {
          formatted += digitsOnly.slice(2);
        }
      }
    } else {
      // Formatação simples para outros países
      formatted = digitsOnly;
    }
    
    setPhoneNumber(formatted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Criar Novo Contato</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <IalogusInput
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            errorMessage={errors.name}
            disabled={isLoading}
          />

          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={isLoading}
              className="block w-20 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F15A24] focus:border-[#F15A24] bg-white text-xs"
            >
              {COUNTRY_CODES.map((country, index) => (
                <option key={`${country.code}-${country.country}-${index}`} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            
            <div className="flex-1">
              <IalogusInput
                label="Telefone"
                value={phoneNumber}
                onChange={handlePhoneChange}
                errorMessage={errors.phoneNumber}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2 rounded-md text-white transition-colors h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: 'linear-gradient(90deg, #F6921E, #EE413D)'
            }}
          >
            {isLoading ? 'Criando...' : 'Criar Contato'}
          </button>
        </div>
      </div>
    </div>
  );
}; 