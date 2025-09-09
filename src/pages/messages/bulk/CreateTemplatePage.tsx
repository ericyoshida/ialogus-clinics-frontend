import { IalogusInput } from '@/components/ui/ialogus-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBulkMessageForm } from '@/hooks/use-bulk-message-form';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { messageTemplatesService } from '@/services';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Idiomas disponíveis com bandeiras
const AVAILABLE_LANGUAGES = [
  { code: 'pt_BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en_US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es_ES', name: 'Español (España)', flag: '🇪🇸' },
  { code: 'es_MX', name: 'Español (México)', flag: '🇲🇽' },
  { code: 'en_GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'fr_FR', name: 'Français (France)', flag: '🇫🇷' },
  { code: 'de_DE', name: 'Deutsch (Deutschland)', flag: '🇩🇪' },
  { code: 'it_IT', name: 'Italiano (Italia)', flag: '🇮🇹' },
];

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

// Componente para seleção de categoria
function CategorySelector({
  value,
  onChange,
  error
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="w-full">
      <div className={cn(
        "relative rounded-md overflow-hidden transition-colors bg-white"
      )}>
        <div className="absolute left-0 right-0 top-0 h-6 z-10 bg-white" />
        
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={cn(
            'border-0 focus:ring-0 rounded-md outline-none focus:outline-none h-14 px-3 w-full relative z-0 bg-transparent',
            error && 'border-red-500'
          )}>
            <div className="pt-4 pb-1">
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
            <SelectItem value="MARKETING">Marketing</SelectItem>
            <SelectItem value="UTILITY">Utilitário</SelectItem>
          </SelectContent>
        </Select>
        
        <label className="absolute left-3 text-xs font-medium top-2 text-gray-600 pointer-events-none z-20">
          Categoria
        </label>
        
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden z-20">
          <div 
            className="w-full h-0.5"
            style={{
              background: 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
            }}
          />
        </div>
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

// Componente para seleção de idioma
function LanguageSelector({
  value,
  onChange,
  error
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const selectedLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === value);

  return (
    <div className="w-full">
      <div className={cn(
        "relative rounded-md overflow-hidden transition-colors bg-white"
      )}>
        <div className="absolute left-0 right-0 top-0 h-6 z-10 bg-white" />
        
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={cn(
            'border-0 focus:ring-0 rounded-md outline-none focus:outline-none h-14 px-3 w-full relative z-0 bg-transparent',
            error && 'border-red-500'
          )}>
            <div className="pt-4 pb-1">
              {selectedLanguage ? (
                <div className="flex items-center gap-2">
                  <span>{selectedLanguage.flag}</span>
                  <span>{selectedLanguage.name}</span>
                </div>
              ) : (
                <SelectValue />
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_LANGUAGES.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-2">
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <label className="absolute left-3 text-xs font-medium top-2 text-gray-600 pointer-events-none z-20">
          Idioma
        </label>
        
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden z-20">
          <div 
            className="w-full h-0.5"
            style={{
              background: 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
            }}
          />
        </div>
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedChannelId } = useBulkMessageForm();
  
  // Estados para os campos do formulário
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('pt_BR');
  const [templateCategory, setTemplateCategory] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Função para tratar mudanças no nome do template
  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Substituir espaços por underscores e converter para minúsculas
    const formattedValue = value.replace(/\s+/g, '_').toLowerCase();
    setTemplateName(formattedValue);
  };

  // Função para inserir variável no texto (apenas nome do cliente)
  const handleAddVariable = () => {
    const cursorPosition = (document.activeElement as HTMLTextAreaElement)?.selectionStart || bodyText.length;
    const beforeCursor = bodyText.substring(0, cursorPosition);
    const afterCursor = bodyText.substring(cursorPosition);
    const newText = beforeCursor + '{{nome_do_cliente}} ' + afterCursor;
    setBodyText(newText);
    
    // Focar no textarea após inserir a variável
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(cursorPosition + 20, cursorPosition + 20); // Posicionar cursor após a variável e espaço
      }
    }, 0);
  };

  // Função para extrair variáveis do texto (apenas aceita nome_do_cliente)
  const extractVariables = (text: string): string[] => {
    const variablePattern = /\{\{nome_do_cliente\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(text)) !== null) {
      if (!variables.includes('nome_do_cliente')) {
        variables.push('nome_do_cliente');
      }
    }
    
    return variables;
  };

  // Função para salvar o template
  const handleSave = async () => {
    // Validação do formulário
    if (!templateName.trim()) {
      setValidationError('O nome do template é obrigatório');
      return;
    }

    if (!templateCategory) {
      setValidationError('A categoria é obrigatória');
      return;
    }

    if (!bodyText.trim()) {
      setValidationError('O texto do template é obrigatório');
      return;
    }

    if (!selectedChannelId) {
      setValidationError('Canal não selecionado. Retorne ao fluxo de criação.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setValidationError('');
      
      // Extrair variáveis do texto (apenas nome_do_cliente é aceita)
      const bodyVariables = extractVariables(bodyText);
      
      // Preparar dados para envio
      const templateData = {
        name: templateName.trim(),
        category: templateCategory as 'AUTHENTICATION' | 'MARKETING' | 'UTILITY',
        language: templateLanguage,
        bodyText: bodyText.trim(),
        bodyVariables,
      };
      
      // Chamar API para criar template
      await messageTemplatesService.createWhatsappTemplate(selectedChannelId, templateData);
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Template criado com sucesso",
        description: `O template ${templateName} foi criado e enviado para aprovação.`,
      });
      
      // Navegar de volta para a tela de seleção de templates
      navigate('/dashboard/messages/bulk/template');
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({
        title: "Erro ao criar template",
        description: "Ocorreu um erro ao criar o template. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para cancelar e voltar
  const handleCancel = () => {
    navigate('/dashboard/messages/bulk/template');
  };
  
  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-5">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2">
          Criar Novo Template de Mensagem
        </h1>
        <p className="text-gray-500 text-sm">
          Crie um novo template de mensagem para ser usado no envio em massa.
        </p>
      </div>
      
      {/* Formulário */}
      <div className="max-w-xl">
        {/* Nome do template */}
        <div className="mb-5">
          <div className="w-full overflow-hidden rounded-md">
            <IalogusInput
              label="Nome do Template"
              value={templateName}
              onChange={handleTemplateNameChange}
              className="w-full bg-white focus:bg-orange-50"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use apenas letras minúsculas, números e underscore. Ex: ola_cliente
          </p>
        </div>
        
        {/* Idioma */}
        <div className="mb-5">
          <LanguageSelector
            value={templateLanguage}
            onChange={setTemplateLanguage}
            error={validationError && !templateLanguage ? 'Idioma é obrigatório' : undefined}
          />
          <p className="text-xs text-gray-500 mt-1">
            Selecione o idioma do template
          </p>
        </div>
        
        {/* Categoria */}
        <div className="mb-5">
          <CategorySelector
            value={templateCategory}
            onChange={setTemplateCategory}
            error={validationError && !templateCategory ? 'Categoria é obrigatória' : undefined}
          />
          <p className="text-xs text-gray-500 mt-1">
            Selecione a categoria do template de acordo com seu propósito
          </p>
        </div>
        
        {/* Texto do template */}
        <div className="mb-5">
          <div className="w-full overflow-hidden rounded-md">
            <IalogusTextarea
              label="Texto da Mensagem"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full bg-white"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Use a variável nome do cliente para personalizar a mensagem.
            </p>
            <button
              type="button"
              onClick={handleAddVariable}
              className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
            >
              + Nome do Cliente
            </button>
          </div>
          {extractVariables(bodyText).length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600">Variável encontrada:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  nome_do_cliente
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Exibir mensagem de erro de validação, se houver */}
        {validationError && (
          <div className="mb-5 text-sm text-red-500">
            {validationError}
          </div>
        )}
      </div>
      
      {/* Botões de ação */}
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
            opacity: isSubmitting || !templateName.trim() || !templateCategory || !bodyText.trim() ? 0.7 : 1 
          }}
          disabled={isSubmitting || !templateName.trim() || !templateCategory || !bodyText.trim()}
        >
          {isSubmitting ? 'Criando...' : 'Criar Template'}
        </button>
      </div>
    </div>
  );
} 