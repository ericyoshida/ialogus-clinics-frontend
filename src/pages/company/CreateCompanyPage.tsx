import { Button } from '@/components/ui/button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { CreateCompanyDto, createCompany } from '@/services/companies'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Componente de TextArea personalizado com o estilo Ialogus
function IalogusTextarea({
  label,
  errorMessage,
  value,
  onChange,
  className,
  ...props
}: {
  label?: string;
  errorMessage?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));

  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative rounded-md overflow-hidden">
          {/* Adicionar área com padding no topo para evitar que o texto toque o label */}
          <div 
            className={cn(
              "absolute left-0 right-0 top-0 h-6 z-10",
              isFocused ? "bg-orange-50" : "bg-white"
            )}
          />
          
          <Textarea
            className={cn(
              'border-0 focus:ring-0 min-h-[120px] rounded-md outline-none focus:outline-none resize-y px-3',
              isFocused ? 'bg-orange-50' : 'bg-white',
              (isFocused || hasValue) ? 'pt-7 pb-2' : 'py-3',
              errorMessage && 'border-red-500',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            onChange={onChange}
            placeholder=""
            {...props}
          />
          
          {label && (
            <label 
              className={cn(
                "absolute left-3 transition-all duration-200 pointer-events-none z-20",
                isFocused 
                  ? "text-xs font-medium top-2" 
                  : hasValue
                    ? "text-xs font-medium top-2 text-gray-600"
                    : "text-base text-gray-500 top-3"
              )}
              style={{
                color: isFocused ? '#F6921E' : undefined
              }}
            >
              {label}
            </label>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <div 
              className={cn(
                'w-full transition-all duration-200', 
                isFocused 
                  ? 'h-1' 
                  : 'h-0.5'
              )}
              style={{
                background: isFocused 
                  ? 'linear-gradient(90deg, #F6921E 14%, #EE413D 45%, #E63F42 50%, #D33952 57%, #B2306D 66%, #852492 76%, #4B14C1 87%, #0501FA 99%, #0000FF 100%)' 
                  : 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
              }}
            />
          </div>
        </div>
      </div>
      
      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Capturar a página de origem do usuário
  const [referrer, setReferrer] = useState('');
  
  useEffect(() => {
    // Obter referrer da state do location (se disponível) ou do document.referrer
    const from = location.state?.from || document.referrer || '/dashboard';
    
    // Verificar se o referrer é da página de seleção de empresa no fluxo de criação de agentes
    const isFromAgentCreation = from.includes('/dashboard/agents/create/company');
    
    // Armazenar o referrer para usar depois
    setReferrer(isFromAgentCreation 
      ? '/dashboard/agents/create/company' 
      : (from || '/dashboard')
    );
  }, [location]);
  
  // Estado para os campos do formulário
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    brandDescription: '',
    businessDescription: ''
  });
  
  // Estado para erros de validação
  const [errors, setErrors] = useState({
    name: '',
    shortName: '',
    brandDescription: '',
    businessDescription: ''
  });
  
  // Função para atualizar o estado do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa o erro quando o usuário começa a digitar
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validação do formulário
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };
    
    // Validar nome (obrigatório)
    if (!formData.name.trim()) {
      newErrors.name = 'O nome da empresa é obrigatório';
      valid = false;
    }
    
    // Validar descrição da marca (obrigatório)
    if (!formData.brandDescription.trim()) {
      newErrors.brandDescription = 'A descrição da marca é obrigatória';
      valid = false;
    }
    
    // Validar descrição do negócio (obrigatório)
    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = 'A descrição do negócio é obrigatória';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setIsSubmitting(true);
        
        // Preparar os dados para envio à API
        const companyData: CreateCompanyDto = {
          name: formData.name,
          shortName: formData.shortName || undefined,
          brandDescription: formData.brandDescription,
          businessDescription: formData.businessDescription
        };
        
        // Chamar a API para criar a empresa
        await createCompany(companyData);
        
        // Mostrar mensagem de sucesso
        toast({
          title: "Empresa criada com sucesso!",
          description: `A empresa ${formData.name} foi criada com sucesso.`,
        });
        
        // Redirecionar para a página de origem
        navigate(referrer);
      } catch (error) {
        console.error('Erro ao criar empresa:', error);
        
        // Mostrar mensagem de erro
        toast({
          title: "Erro ao criar empresa",
          description: "Ocorreu um erro ao criar a empresa. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Função para cancelar e voltar para a tela anterior
  const handleCancel = () => {
    navigate(-1);
  };
  
  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pl-1">
        <div className="flex-1 mb-2 sm:mb-0">
          <h1 className="text-[21px] font-medium text-gray-900 mt-2">
            Criar Nova Empresa
          </h1>
          <p className="text-gray-500 text-sm">Preencha as informações abaixo para criar uma nova empresa</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="space-y-6">
          {/* Nome da empresa */}
          <div className="space-y-1">
            <IalogusInput
              label="Nome da empresa"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              errorMessage={errors.name}
              required
              className="w-full bg-white focus:bg-orange-50"
            />
          </div>
          
          {/* Nome curto (opcional) */}
          <div className="space-y-1">
            <IalogusInput
              label="Nome curto (opcional)"
              name="shortName"
              value={formData.shortName}
              onChange={handleInputChange}
              errorMessage={errors.shortName}
              className="w-full bg-white focus:bg-orange-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              O agente terá preferência de usar este nome nas conversas
            </p>
          </div>
          
          {/* Descrição da marca */}
          <div className="space-y-1">
            <IalogusTextarea
              label="Descrição da marca"
              name="brandDescription"
              value={formData.brandDescription}
              onChange={handleInputChange}
              errorMessage={errors.brandDescription}
              required
              className="w-full bg-white focus:bg-orange-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Descreva características da marca, valores e como ela se apresenta para clientes
            </p>
          </div>
          
          {/* Descrição do negócio */}
          <div className="space-y-1">
            <IalogusTextarea
              label="Descrição do negócio"
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleInputChange}
              errorMessage={errors.businessDescription}
              required
              className="w-full bg-white focus:bg-orange-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Descreva as atividades da empresa e sua área de atuação para ajudar a contextualizar o agente
            </p>
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            type="button"
            onClick={handleCancel}
            variant="outline"
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          
          <Button 
            type="submit"
            className="w-full sm:w-auto order-1 sm:order-2"
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(90deg, #F6921E, #EE413D)',
            }}
          >
            {isSubmitting ? 'Criando...' : 'Criar Empresa'}
          </Button>
        </div>
      </form>
    </div>
  );
} 