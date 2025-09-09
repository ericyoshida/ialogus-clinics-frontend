import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { IalogusInput } from '../../../components/ui/ialogus-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { useBulkMessageForm } from '../../../hooks/use-bulk-message-form';
import { useToast } from '../../../hooks/use-toast';
import { cn } from '../../../lib/utils';
import { messageTemplatesService } from '../../../services';
import { WhatsappMessageTemplate } from '../../../services/messageTemplates';

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
  error,
  disabled = false
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="w-full">
      <div className={cn(
        "relative rounded-md overflow-hidden transition-colors bg-white",
        disabled && "opacity-50"
      )}>
        <div className="absolute left-0 right-0 top-0 h-6 z-10 bg-white" />
        
        <Select value={value} onValueChange={onChange} disabled={disabled}>
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
  error,
  disabled = false
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const selectedLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === value);

  return (
    <div className="w-full">
      <div className={cn(
        "relative rounded-md overflow-hidden transition-colors bg-white",
        disabled && "opacity-50"
      )}>
        <div className="absolute left-0 right-0 top-0 h-6 z-10 bg-white" />
        
        <Select value={value} onValueChange={onChange} disabled={disabled}>
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

export default function EditTemplatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { templateId } = useParams<{ templateId: string }>();
  const { selectedChannelId } = useBulkMessageForm();
  
  // Dados do template passados via navegação
  const templateDataFromState = location.state?.templateData as WhatsappMessageTemplate | undefined;
  
  // Estados para os campos do formulário
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('pt_BR');
  const [templateCategory, setTemplateCategory] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [originalTemplate, setOriginalTemplate] = useState<WhatsappMessageTemplate | null>(null);

  // Carregar dados do template ao montar o componente
  useEffect(() => {
    const loadTemplateData = async () => {
      if (!templateId) {
        toast({
          title: "Erro",
          description: "ID do template não encontrado.",
          variant: "destructive",
        });
        navigate('/dashboard/messages/bulk/template');
        return;
      }

      try {
        setIsLoading(true);
        
        // Usar dados passados via state se disponíveis
        if (templateDataFromState) {
          console.log('Usando dados do template passados via navegação:', templateDataFromState);
          
          setOriginalTemplate(templateDataFromState);
          setTemplateName(templateDataFromState.messageTemplateName);
          setTemplateLanguage(templateDataFromState.messageTemplateLanguage);
          setTemplateCategory(templateDataFromState.category);
          setBodyText(templateDataFromState.whatsappMessageTemplateBody.bodyText);
        } else {
          // Fallback: tentar buscar via API (pode falhar se a rota não existir)
          console.log('Dados não passados via navegação, tentando buscar via API...');
          
          const template = await messageTemplatesService.getWhatsappMessageTemplateById(templateId);
          
          setOriginalTemplate(template);
          setTemplateName(template.messageTemplateName);
          setTemplateLanguage(template.messageTemplateLanguage);
          setTemplateCategory(template.category);
          setBodyText(template.whatsappMessageTemplateBody.bodyText);
        }
        
      } catch (error) {
        console.error('Erro ao carregar template:', error);
        toast({
          title: "Erro ao carregar template",
          description: "Não foi possível carregar os dados do template. Retornando à lista de templates.",
          variant: "destructive",
        });
        navigate('/dashboard/messages/bulk/template');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateData();
  }, [templateId, templateDataFromState, navigate, toast]);

  // Função para tratar mudanças no nome do template (desabilitada na edição)
  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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
    
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(cursorPosition + 20, cursorPosition + 20);
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

  // Função para salvar as alterações do template
  const handleSave = async () => {
    if (!templateId) {
      setValidationError('ID do template não encontrado');
      return;
    }

    // Validação do formulário
    if (!bodyText.trim()) {
      setValidationError('O texto do template é obrigatório');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setValidationError('');
      
      // Extrair variáveis do texto
      const bodyVariables = extractVariables(bodyText);
      
      // Preparar dados para envio
      const updateData = {
        category: templateCategory as 'AUTHENTICATION' | 'MARKETING' | 'UTILITY',
        bodyText: bodyText.trim(),
        bodyVariables,
      };
      
      // Chamar serviço para atualizar template
      const result = await messageTemplatesService.updateWhatsappTemplate(templateId, updateData);
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Template atualizado com sucesso",
        description: `O template ${templateName} foi atualizado ${result.apiSuccess ? 'na API do WhatsApp' : 'localmente'}.`,
      });
      
      // Navegar de volta para a tela de seleção de templates
      navigate('/dashboard/messages/bulk/template');
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      
      let errorMessage = "Ocorreu um erro ao atualizar o template. Tente novamente.";
      
      // Verificar se é um erro específico da API do WhatsApp
      if (error instanceof Error && error.name === 'WhatsappApiError') {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao atualizar template",
        description: errorMessage,
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

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-pulse space-y-4">
            <div className="flex space-x-4">
              <div className="rounded bg-gray-200 h-4 w-48"></div>
            </div>
            <div className="space-y-2">
              <div className="rounded bg-gray-200 h-4 w-full"></div>
              <div className="rounded bg-gray-200 h-4 w-3/4"></div>
            </div>
            <p className="text-center text-gray-500">Carregando template...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-5">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2">
          Editar Template de Mensagem
        </h1>
        <p className="text-gray-500 text-sm">
          Edite o template de mensagem existente. Apenas algumas propriedades podem ser alteradas.
        </p>
      </div>
      
      {/* Formulário */}
      <div className="max-w-xl">
        {/* Nome do template (desabilitado) */}
        <div className="mb-5">
          <div className="w-full overflow-hidden rounded-md">
            <IalogusInput
              label="Nome do Template"
              value={templateName}
              onChange={handleTemplateNameChange}
              className="w-full bg-gray-50 focus:bg-gray-50 text-gray-500"
              disabled
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            O nome do template não pode ser alterado após a criação
          </p>
        </div>
        
        {/* Idioma (desabilitado) */}
        <div className="mb-5">
          <LanguageSelector
            value={templateLanguage}
            onChange={setTemplateLanguage}
            disabled={true}
          />
          <p className="text-xs text-gray-500 mt-1">
            O idioma do template não pode ser alterado após a criação
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
        
        {/* Status do template atual */}
        {originalTemplate && (
          <div className="mb-5 p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 mb-1">Status atual do template:</p>
            <span className={`inline-block px-2 py-0.5 text-xs font-medium border rounded-full ${
              originalTemplate.messageTemplateStatus.toLowerCase() === 'approved'
                ? 'text-green-600 bg-green-50 border-green-200'
                : originalTemplate.messageTemplateStatus.toLowerCase() === 'pending'
                ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                : 'text-red-600 bg-red-50 border-red-200'
            }`}>
              {originalTemplate.messageTemplateStatus.toLowerCase() === 'approved' ? 'Aprovado' : 
               originalTemplate.messageTemplateStatus.toLowerCase() === 'pending' ? 'Pendente' : 'Rejeitado'}
            </span>
          </div>
        )}
        
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
            opacity: isSubmitting || !bodyText.trim() ? 0.7 : 1 
          }}
          disabled={isSubmitting || !bodyText.trim()}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
} 