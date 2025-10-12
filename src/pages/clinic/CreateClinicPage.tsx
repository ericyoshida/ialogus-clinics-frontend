import { Button } from '@/components/ui/button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { CreateClinicDto, createClinic } from '@/services/clinics'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


export default function CreateClinicPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Capturar a página de origem do usuário
  const [referrer, setReferrer] = useState('');
  
  useEffect(() => {
    // Obter referrer da state do location (se disponível) ou do document.referrer
    const from = location.state?.from || document.referrer || '/dashboard';
    
    // Verificar se o referrer é da página de seleção de clínica no fluxo de criação de agentes
    const isFromAgentCreation = from.includes('/dashboard/agents/create/clinic');
    
    // Armazenar o referrer para usar depois
    setReferrer(isFromAgentCreation 
      ? '/dashboard/agents/create/clinic' 
      : (from || '/dashboard')
    );
  }, [location]);
  
  // Estado para os campos do formulário
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    acceptedInsurances: [] as string[]
  });

  // Estado para erros de validação
  const [errors, setErrors] = useState({
    name: '',
    address: ''
  });

  // Estados para o sistema de tags de convênios
  const [showInsuranceInput, setShowInsuranceInput] = useState(false);
  const [newInsurance, setNewInsurance] = useState('');
  
  // Função para atualizar o estado do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Funções para gerenciar convênios
  const addInsurance = () => {
    if (newInsurance.trim() && !formData.acceptedInsurances.includes(newInsurance.trim())) {
      setFormData(prev => ({
        ...prev,
        acceptedInsurances: [...prev.acceptedInsurances, newInsurance.trim()]
      }));
      setNewInsurance('');
      setShowInsuranceInput(false);
    }
  };

  const removeInsurance = (index: number) => {
    setFormData(prev => ({
      ...prev,
      acceptedInsurances: prev.acceptedInsurances.filter((_, i) => i !== index)
    }));
  };
  
  // Validação do formulário
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    // Validar nome (obrigatório)
    if (!formData.name.trim()) {
      newErrors.name = 'O nome da clínica é obrigatório';
      valid = false;
    }

    // Validar endereço (obrigatório)
    if (!formData.address.trim()) {
      newErrors.address = 'O endereço da clínica é obrigatório';
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
        const clinicData: CreateClinicDto = {
          name: formData.name,
          address: formData.address,
          acceptedInsurances: formData.acceptedInsurances
        };
        
        // Chamar a API para criar a clínica
        await createClinic(clinicData);
        
        // Mostrar mensagem de sucesso
        toast({
          title: "Clínica criada com sucesso!",
          description: `A clínica ${formData.name} foi criada com sucesso.`,
        });
        
        // Redirecionar para a página de origem
        navigate(referrer);
      } catch (error) {
        console.error('Erro ao criar clínica:', error);
        
        // Mostrar mensagem de erro
        toast({
          title: "Erro ao criar clínica",
          description: "Ocorreu um erro ao criar a clínica. Tente novamente.",
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
            Criar Nova Clínica
          </h1>
          <p className="text-gray-500 text-sm">Preencha as informações abaixo para criar uma nova clínica</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="space-y-6">
          {/* Nome da clínica */}
          <div className="space-y-1">
            <IalogusInput
              label="Nome da clínica"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              errorMessage={errors.name}
              required
              className="w-full bg-white focus:bg-orange-50"
            />
          </div>

          {/* Endereço da clínica */}
          <div className="space-y-1">
            <IalogusInput
              label="Endereço"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              errorMessage={errors.address}
              required
              className="w-full bg-white focus:bg-orange-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              O agente utilizará este endereço para informar a localização da clínica
            </p>
          </div>

          {/* Convênios aceitos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Convênios aceitos</label>
            <div className="flex flex-wrap gap-2">
              {formData.acceptedInsurances.map((insurance, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded group"
                >
                  <span>{insurance}</span>
                  <button
                    type="button"
                    onClick={() => removeInsurance(index)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              {showInsuranceInput ? (
                <div className="flex items-center gap-1 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="relative rounded-md overflow-hidden">
                      <input
                        type="text"
                        value={newInsurance}
                        onChange={(e) => setNewInsurance(e.target.value)}
                        onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                        onBlur={(e) => e.target.parentElement?.classList.remove('focused')}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInsurance())}
                        className="w-full h-10 px-3 text-sm bg-gray-100 rounded-md border-0 focus:ring-0 focus:outline-none focus:bg-orange-50 transition-colors"
                        placeholder="Nome do convênio"
                        autoFocus
                      />
                      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
                        <div
                          className={cn(
                            'w-full transition-all duration-200',
                            'h-0.5'
                          )}
                          style={{
                            background: 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addInsurance}
                    className="text-green-600 hover:text-green-800 text-sm px-2 py-2 flex-shrink-0"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInsuranceInput(false);
                      setNewInsurance('');
                    }}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-2 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowInsuranceInput(true)}
                  className="px-2 py-1 text-xs border border-dashed border-gray-300 text-gray-500 rounded hover:border-gray-400 hover:text-gray-600"
                >
                  + Adicionar convênio
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lista de convênios e planos de saúde aceitos pela clínica (opcional)
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
            {isSubmitting ? 'Criando...' : 'Criar Clínica'}
          </Button>
        </div>
      </form>
    </div>
  );
} 