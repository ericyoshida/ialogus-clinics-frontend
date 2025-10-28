import { MultiStepAgent } from '@/components/multi-step-agent'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { useClinics } from '@/hooks/use-clinics'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function AgentNamePage() {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();

  // Estado para o nome do agente
  const [agentName, setAgentName] = useState('');
  const [nameError, setNameError] = useState('');

  // Buscar nome da clínica
  const { clinics } = useClinics();
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...';

  // Validar se temos um clinicId
  useEffect(() => {
    if (!clinicId) {
      navigate('/dashboard');
      return;
    }

    // Salvar clinicId no localStorage para o fluxo
    localStorage.setItem('temp_selected_clinic', clinicId);
  }, [clinicId, navigate]);

  // Carregar dados salvos do localStorage quando o componente é montado
  useEffect(() => {
    const savedAgentName = localStorage.getItem('temp_agent_name');
    if (savedAgentName) {
      setAgentName(savedAgentName);
    }
  }, []);

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    if (agentName) {
      localStorage.setItem('temp_agent_name', agentName);
    }
  }, [agentName]);

  // Função para avançar para a próxima etapa
  const handleNext = () => {
    // Validar nome do agente
    if (!agentName.trim()) {
      setNameError('O nome do agente é obrigatório');
      return;
    }

    // Navegar para a próxima etapa
    navigate(`/dashboard/clinic/${clinicId}/agents/create/product-catalog`);
  };

  // Função para voltar à etapa anterior
  const handleBack = () => {
    navigate(`/dashboard/clinic/${clinicId}/agents`);
  };

  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-2">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Criar Novo Agente
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{clinicName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Etapa 1: Defina o nome do agente</p>

        {/* Indicador de multistep abaixo do título */}
        <div className="w-full mb-6">
          <MultiStepAgent
            currentStep={1}
            totalSteps={3}
            className="max-w-full"
          />
        </div>

        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-medium text-gray-800">Nome do Agente</h2>
        </div>

        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-6">Digite o nome que será exibido para os clientes nas conversas</p>
      </div>

      {/* Formulário */}
      <div className="max-w-full mx-0">
        {/* Campo de nome do agente */}
        <div className="mb-6">
          <div className="w-full md:w-[520px] overflow-hidden rounded-md">
            <IalogusInput
              label="Nome do Agente"
              value={agentName}
              onChange={(e) => {
                setAgentName(e.target.value);
                if (e.target.value.trim()) setNameError('');
              }}
              errorMessage={nameError}
              className="w-full bg-white focus:bg-orange-50"
              required
              placeholder="Ex: Maria - Atendimento"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Este será o nome que aparecerá para os clientes nas conversas
          </p>
        </div>

        {/* Botões de navegação */}
        <div className="flex justify-between mt-10 max-w-[520px]">
          <button
            onClick={handleBack}
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-md text-white transition-colors"
            style={{
              background: 'linear-gradient(90deg, #F6921E, #EE413D)',
              opacity: !agentName.trim() ? 0.7 : 1
            }}
            disabled={!agentName.trim()}
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
