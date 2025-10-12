import { IalogusInput } from '@/components/ui/ialogus-input'
import { Textarea } from '@/components/ui/textarea'
import { useClinics } from '@/hooks/use-clinics'
import { cn } from '@/lib/utils'
import { ChevronDown, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../../hooks/use-toast'
import { createProduct, getClinicCalendars, type Calendar } from '../../../services/products'

// Componente de TextArea personalizado com o estilo Ialogus
function IalogusTextarea({
  label,
  errorMessage,
  value,
  onChange,
  className,
  onFocus,
  onBlur,
  ...props
}: {
  label?: string;
  errorMessage?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  className?: string;
  [x: string]: unknown;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));

  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className="w-full">
      <div className={cn(
        "relative rounded-md overflow-hidden transition-colors",
        isFocused ? "bg-orange-50" : "bg-white"
      )}>
        {/* Adicionar área com padding no topo para evitar que o texto toque o label */}
        <div 
          className={cn(
            "absolute left-0 right-0 top-0 h-6 z-10",
            isFocused ? "bg-orange-50" : "bg-white"
          )}
        />
        
        <Textarea
          className={cn(
            'border-0 focus:ring-0 min-h-[90px] rounded-md outline-none focus:outline-none resize-y px-3 w-full relative z-0',
            (isFocused || hasValue) ? 'pt-7 pb-2' : 'py-3',
            errorMessage && 'border-red-500',
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChange={onChange}
          placeholder=""
          style={{ backgroundColor: 'transparent' }}
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
        
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden z-20">
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
      
      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

// Componente para seleção de tipo com opções lado a lado
function ProductTypeSelector({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full">
      <label className="text-xs font-medium text-gray-600 mb-1 block">
        Tipo
      </label>
      <div className="flex w-fit">
        <div className="relative">
          <button
            type="button"
            className={cn(
              "py-2.5 px-10 text-base transition-colors",
              value === 'product' 
                ? "bg-orange-50 text-orange-500 font-bold" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => onChange('product')}
          >
            Produto
          </button>
          {/* Barra colorida na parte inferior */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <div 
              className={cn(
                'w-full transition-all duration-200', 
                value === 'product' ? 'h-1' : 'h-0.5'
              )}
              style={{
                background: value === 'product' 
                  ? 'linear-gradient(90deg, #F6921E 14%, #EE413D 86%)' 
                  : 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
              }}
            />
          </div>
        </div>
        
        <div className="relative">
          <button
            type="button"
            className={cn(
              "py-2.5 px-10 text-base transition-colors",
              value === 'service' 
                ? "bg-orange-50 text-orange-500 font-bold" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => onChange('service')}
          >
            Serviço
          </button>
          {/* Barra colorida na parte inferior */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <div 
              className={cn(
                'w-full transition-all duration-200', 
                value === 'service' ? 'h-1' : 'h-0.5'
              )}
              style={{
                background: value === 'service' 
                  ? 'linear-gradient(90deg, #F6921E 14%, #EE413D 86%)' 
                  : 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Função para criar um input de preço com prefixo R$
function PriceInputWithPrefix({
  value,
  onChange,
  required = false
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  // Estados para controlar o foco e se tem valor
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));

  // Atualizar o estado de valor quando o valor mudar
  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  // Handlers para foco e blur
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
  };

  return (
    <div className="w-full">
      <div className="flex rounded-md overflow-hidden">
        {/* Prefixo R$ com fundo cinza */}
        <div className={cn(
          "flex items-center justify-center px-3 rounded-l-md border-y border-l border-0 transition-all duration-200",
          isFocused ? "bg-orange-100 border-orange-200" : "bg-gray-200 border-gray-300"
        )}>
          <span 
            className={cn(
              "font-medium transition-all duration-200",
              isFocused ? "text-orange-600" : "text-gray-700"
            )}
            style={{
              transform: (isFocused || hasValue) ? 'translateY(10px)' : 'translateY(0)',
              paddingBottom: (isFocused || hasValue) ? '4px' : '0',
            }}
          >
            R$
          </span>
        </div>
        
        {/* Container do input com estilo Ialogus */}
        <div className="relative flex-1 rounded-r-md overflow-hidden">
          <div className={cn(
            "absolute inset-0 transition-colors",
            isFocused ? "bg-orange-50" : "bg-white"
          )} />
          
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'ialogus-input border-0 focus:ring-0 py-3 px-3 bg-transparent relative z-10 w-full h-14 rounded-r-md outline-none',
              (isFocused || hasValue) && 'pt-6 pb-2',
            )}
            required={required}
            placeholder=""
          />
          
          {/* Label com classes exatamente iguais ao IalogusInput */}
          <label 
            className={cn(
              "floating-label",
              isFocused 
                ? "floating-label-active" 
                : hasValue
                  ? "floating-label-active text-gray-600"
                  : "floating-label-inactive"
            )}
            style={{
              color: isFocused ? '#F6921E' : undefined
            }}
          >
            Preço
          </label>
          
          {/* Barra colorida na parte inferior */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <div 
              className={cn(
                'w-full transition-all duration-200', 
                isFocused ? 'h-1' : 'h-0.5'
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
    </div>
  );
}

// Componente de Seleção de Prestador de Serviço (com posicionamento corrigido)
function ServiceProviderSelect({
  value,
  onChange,
  required = false,
  clinicId
}: {
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  clinicId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [providers, setProviders] = useState<Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Atualizar a posição do dropdown quando abrir
  useEffect(() => {
    if (isOpen && buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen, buttonRef]);
  
  // Manipular o clique fora do dropdown para fechá-lo
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef && !buttonRef.contains(e.target as Node)) {
        const dropdownElement = document.getElementById('service-provider-dropdown');
        if (dropdownElement && !dropdownElement.contains(e.target as Node)) {
          setIsOpen(false);
          setIsFocused(false);
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, buttonRef]);
  
  // Handler para clicar no campo
  const handleFieldClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impedir que o evento de clique seja processado pelo documento
    setIsOpen(!isOpen);
    setIsFocused(true);
  };
  
  // Carrega os prestadores de serviço da API
  useEffect(() => {
    const fetchServiceProviders = async () => {
      if (!clinicId) {
        setError('ID da clínica não encontrado');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const calendars = await getClinicCalendars(clinicId);
        setProviders(calendars);
      } catch (err) {
        console.error('Erro ao buscar prestadores de serviço:', err);
        setError('Não foi possível carregar os prestadores de serviço');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceProviders();
  }, [clinicId]);
  
  // Obter nomes formatados para exibição
  const getSelectedProviderNames = () => {
    if (!value || value.length === 0) return '';
    
    return value.map(providerId => {
      const provider = providers.find(p => p.calendarId === providerId);
      return provider?.user.name || 'Prestador desconhecido';
    }).join(', ');
  };
  
  // Handler para adicionar novo prestador
  const handleAddNewProvider = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Aqui seria a lógica para adicionar um novo prestador
    // Por enquanto, apenas um placeholder
    alert('Funcionalidade para adicionar prestador de serviço em desenvolvimento');
  };
  
  // Renderizar o dropdown no portal
  const renderDropdown = () => {
    if (!isOpen) return null;
    
    // Calcular a altura máxima disponível na tela
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - dropdownPosition.top;
    const maxHeight = Math.min(300, spaceBelow - 20); // 20px de margem de segurança
    
    return createPortal(
      <div 
        id="service-provider-dropdown"
        className="fixed shadow-lg border border-gray-200 bg-white rounded-md overflow-hidden z-[9999]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          maxHeight: `${maxHeight}px`, // Limitar a altura máxima
          overflowY: 'auto' // Garantir que tenha scroll vertical se necessário
        }}
      >
        {isLoading ? (
          <div className="p-3 text-center text-gray-500">
            Carregando prestadores de serviço...
          </div>
        ) : error ? (
          <div className="p-3 text-center text-red-500">
            {error}
          </div>
        ) : providers.length === 0 ? (
          <>
            <div className="p-3 text-center text-gray-500">
              Nenhum prestador de serviço encontrado.
            </div>
            {/* Botão para adicionar novo prestador */}
            <div className="border-t border-gray-100 py-1 px-3">
              <button
                type="button"
                className="w-full text-left py-2 px-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center"
                onClick={handleAddNewProvider}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="mr-2"
                >
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Adicionar Novo Prestador</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Conteúdo do dropdown */}
            <div className="py-1">
              {providers.map((provider) => (
                <div
                  key={provider.calendarId}
                  className={`
                    flex items-center px-3 py-2 cursor-pointer transition-colors
                    ${value.includes(provider.calendarId) 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-500'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newValue = value.includes(provider.calendarId)
                      ? value.filter(id => id !== provider.calendarId)
                      : [...value, provider.calendarId];
                    onChange(newValue);
                  }}
                >
                  <User size={14} className="mr-2 text-gray-500" />
                  <span>{provider.user.name}</span>
                </div>
              ))}
            </div>
            
            {/* Botão para adicionar novo prestador */}
            <div className="border-t border-gray-100 py-1 px-3">
              <button
                type="button"
                className="w-full text-left py-2 px-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center"
                onClick={handleAddNewProvider}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="mr-2"
                >
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Adicionar Novo Prestador</span>
              </button>
            </div>
          </>
        )}
      </div>,
      document.body
    );
  };
  
  return (
    <div className="w-full mb-1.5 relative">
      <div className="w-full relative">
        {/* Campo principal com posicionamento ajustado */}
        <button 
          type="button"
          ref={setButtonRef}
          onClick={handleFieldClick}
          className={`
            w-full h-14 rounded-md px-3 relative cursor-pointer
            text-left border-none outline-none focus:outline-none
            ${isFocused ? 'bg-orange-50' : 'bg-white'}
          `}
        >
          {/* Container flex para alinhamento vertical apropriado */}
          <div className={`
            flex items-center justify-between w-full h-full
            ${(isFocused || Boolean(value.length)) ? 'pt-4' : ''}
          `}>
            {/* Mostrar apenas o valor selecionado com posicionamento corrigido */}
            <span className={`text-gray-600 truncate ${!value.length && 'opacity-0'}`}>
              {isLoading ? 'Carregando prestadores...' :
               error ? 'Erro ao carregar prestadores' :
               getSelectedProviderNames() || 'Vazio'}
            </span>
            
            {/* Seta */}
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            />
          </div>
        </button>
        
        {/* Label */}
        <label className={`
          absolute left-3 pointer-events-none transition-all duration-200
          ${isFocused || Boolean(value.length) 
            ? 'text-xs font-medium top-2 ' + (isFocused ? 'text-orange-500' : 'text-gray-600')
            : 'text-base text-gray-500 top-1/2 -translate-y-1/2'
          }
        `}>
          Prestadores de Serviço
        </label>
        
        {/* Barra inferior */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <div 
            className={`w-full ${isFocused ? 'h-1' : 'h-0.5'} transition-all duration-200`} 
            style={{
              background: isFocused 
                ? 'linear-gradient(90deg, #F6921E 14%, #EE413D 45%, #E63F42 50%, #D33952 57%, #B2306D 66%, #852492 76%, #4B14C1 87%, #0501FA 99%, #0000FF 100%)' 
                : 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
            }}
          />
        </div>
      </div>
      
      {/* Renderizar o dropdown no portal */}
      {renderDropdown()}
    </div>
  );
}

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  const { clinics } = useClinics();
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...';
  
  // Estados para os campos do formulário
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productType, setProductType] = useState('product'); // 'product' ou 'service'
  const [serviceProviders, setServiceProviders] = useState<string[]>([]); // IDs dos prestadores de serviço
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { toast } = useToast();
  
  // Carregar dados salvos no localStorage quando o componente é montado
  useEffect(() => {
    // Verificar se há dados salvos para este produto específico
    const tempProductDataJson = localStorage.getItem('temp_product_data');
    if (tempProductDataJson) {
      try {
        const tempProductData = JSON.parse(tempProductDataJson);
        setProductName(tempProductData.name || '');
        setProductDescription(tempProductData.description || '');
        setProductPrice(tempProductData.price || '');
        setProductType(tempProductData.type || 'product');
        setServiceProviders(tempProductData.serviceProviders || []);
      } catch (error) {
        console.error('Erro ao carregar dados do produto do localStorage:', error);
      }
    }
  }, []);

  // Salvar dados no localStorage quando os estados mudarem
  useEffect(() => {
    // Salvar apenas se pelo menos um dos campos tiver valor
    if (productName || productDescription || productPrice || serviceProviders.length > 0) {
      const productData = {
        name: productName,
        description: productDescription,
        price: productPrice,
        type: productType,
        serviceProviders
      };
      
      localStorage.setItem('temp_product_data', JSON.stringify(productData));
    }
  }, [productName, productDescription, productPrice, productType, serviceProviders]);
  
  // Função para formatar o preço enquanto o usuário digita
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remover tudo exceto números
    value = value.replace(/[^\d]/g, '');
    
    // Converter para centavos e formatar
    if (value) {
      const cents = parseInt(value, 10);
      const formattedValue = (cents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      });
      
      // Remover o símbolo R$ para evitar duplicação
      setProductPrice(formattedValue.replace('R$', '').trim());
    } else {
      setProductPrice('');
    }
  };
  
  // Função para salvar o produto
  const handleSave = async () => {
    // Validação do formulário
    if (!productName.trim()) {
      setValidationError('O nome do produto é obrigatório');
      return;
    }
    
    if (!clinicId) {
      setValidationError('ID da clínica não encontrado');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setValidationError('');
      
      // Formatar o preço para API (remover formatação)
      const formattedPrice = productPrice
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
      
      // Preparar dados para envio
      const productData = {
        name: productName,
        description: productDescription,
        listPrice: formattedPrice,
        serviceProviderCalendarIds: productType === 'service' ? serviceProviders : []
      };
      
      // Chamar API para criar produto
      await createProduct(clinicId, productData);
      
      // Limpar dados temporários
      localStorage.removeItem('temp_product_data');
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Produto criado com sucesso",
        description: `O produto ${productName} foi criado com sucesso.`,
      });
      
      // Navegar de volta para a tela anterior
      navigate(`/dashboard/clinic/${clinicId}/agents/create/product-catalog/create`);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro ao criar produto",
        description: "Ocorreu um erro ao criar o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para cancelar e voltar
  const handleCancel = () => {
    // Não limpar os dados temporários do produto ao cancelar para permitir
    // que o usuário possa retornar e continuar a edição futuramente
    
    // Navegar de volta para a página de criação de catálogo sem limpar os dados
    navigate(`/dashboard/clinic/${clinicId}/agents/create/product-catalog/create`);
  };
  
  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-5">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Catálogo de Produtos | Cadastrar Novo Produto
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{clinicName}</span>
        </h1>
      </div>
      
      {/* Formulário */}
      <div className="max-w-xl">
        {/* Nome do produto */}
        <div className="mb-5">
          <div className="w-full overflow-hidden rounded-md">
            <IalogusInput
              label="Nome do Produto"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-white focus:bg-orange-50"
              required
            />
          </div>
        </div>
        
        {/* Descrição do produto (com TextArea) */}
        <div className="mb-5">
          <div className="w-full overflow-hidden rounded-md">
            <IalogusTextarea
              label="Descrição"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="w-full bg-white"
            />
          </div>
        </div>
        
        {/* Preço do produto com prefixo R$ */}
        <div className="mb-5">
          <PriceInputWithPrefix
            value={productPrice}
            onChange={handlePriceChange}
            required
          />
        </div>
        
        {/* Seleção de tipo: Produto ou Serviço (lado a lado) */}
        <div className="mb-5">
          <ProductTypeSelector
            value={productType}
            onChange={setProductType}
          />
        </div>
        
        {/* Campo de prestador de serviço (mostrado apenas quando o tipo é 'service') */}
        {productType === 'service' && (
          <div className="mb-5 animate-fadeIn relative">
            <ServiceProviderSelect
              value={serviceProviders}
              onChange={setServiceProviders}
              required
              clinicId={clinicId}
            />
          </div>
        )}
        
        {/* Exibir mensagem de erro de validação, se houver */}
        {validationError && (
          <div className="mb-5 text-sm text-red-500">
            {validationError}
          </div>
        )}
      </div>
      
      {/* Botões de ação - ajustar para garantir que não sobreponha dropdowns */}
      <div className="flex mt-10 relative z-10">
        <button
          onClick={handleCancel}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-md text-white transition-colors"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)',
            opacity: isSubmitting || !productName.trim() ? 0.7 : 1 
          }}
          disabled={isSubmitting || !productName.trim()}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </div>
  );
}

// Definir animação de fadeIn no arquivo de CSS global
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
`;

// Adicionar a animação ao head do documento
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = fadeInAnimation;
  document.head.appendChild(style);
} 