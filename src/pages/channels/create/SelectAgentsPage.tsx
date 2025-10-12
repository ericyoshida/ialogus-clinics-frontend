import { AgentCard } from '@/components/agents/AgentCard'
import { MultiStepChannel } from '@/components/multi-step-channel'
import { useChannelCreationForm } from '@/hooks/use-channel-creation-form'
import { useClinics } from '@/hooks/use-clinics'
import { agentsService } from '@/services'
import type { Agent } from '@/services/agents'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'


function SelectableAgentCard({ 
  agent, 
  selected, 
  onClick
}: { 
  agent: Agent
  selected: boolean
  onClick: () => void
}) {
  const navigate = useNavigate()

  const formatName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const getAgentType = (departmentName: string) => {
    if (departmentName.toLowerCase().includes('vendas')) {
      return 'Vendas'
    }
    return 'Suporte ao Cliente'
  }

  const handleEditAgent = () => {
    console.log('Editar agente:', agent.botName)
    navigate(`/dashboard/agents?editAgent=${agent.botModelId}`)
  }

  const handleDeleteAgent = () => {
    console.log('Deletar agente:', agent.botName)
  }

  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      {selected && (
        <div className="absolute -top-5 left-3 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white">
          Selecionado
        </div>
      )}
      
      <div className="w-full h-full">
        <AgentCard
          name={formatName(agent.botName)}
          type={getAgentType(agent.departmentName)}
          conversationsToday={agent.todayActiveConversationsCount || 0}
          activeChannels={agent.connectedChannels?.map(channel => channel.channelType.toLowerCase()) || ['chat']}
          onClick={onClick}
          className={`h-full w-full ${selected ? 'ring-2 ring-offset-2 ring-orange-500' : ''}`}
          showMenu={true}
          onEdit={handleEditAgent}
          onDelete={handleDeleteAgent}
          editLabel="Editar Agente"
          deleteLabel="Gerenciar"
        />
      </div>
      
      {selected && (
        <div 
          className="absolute inset-0 z-5 rounded-lg pointer-events-none bg-orange-500 opacity-10"
        />
      )}
    </div>
  )
}

function AddAgentCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-[250px] h-[250px] relative flex-shrink-0 mt-6 mb-6">
      <div 
        onClick={onClick}
        className="w-full h-full cursor-pointer hover:scale-105 transition-all duration-200 group"
      >
        <img 
          src="/images/add-agent.svg" 
          alt="Criar Novo Agente"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}

export default function SelectAgentsPage() {
  const navigate = useNavigate()
  const { clinicId } = useParams<{ clinicId: string }>()
  const { selectedAgentIds, toggleAgentSelection, updateFormData, clearFormData } = useChannelCreationForm()
  const [currentPage, setCurrentPage] = useState(0)
  
  const { clinics, loading: loadingClinics } = useClinics()
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...'
  
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastClinicId, setLastClinicId] = useState<string | undefined>(undefined)

  // Limpar dados do formulário quando a clínica mudar
  useEffect(() => {
    // Inicializar lastClinicId na primeira montagem
    if (lastClinicId === undefined) {
      setLastClinicId(clinicId)
      return
    }
    
    if (clinicId !== lastClinicId) {
      console.log('Clínica mudou no fluxo de criação de canal, limpando todos os dados')
      
      // Limpar localStorage manualmente também
      localStorage.removeItem('channel-creation-form')
      
      // Limpar o formulário
      clearFormData()
      setLastClinicId(clinicId)
      
      // Forçar atualização do estado local
      setCurrentPage(0)
      setAllAgents([])
    }
  }, [clinicId, clearFormData])

  useEffect(() => {
    const fetchClinicAgents = async () => {
      if (!clinicId) {
        setError('Nenhuma clínica selecionada')
        setLoadingAgents(false)
        return
      }

      try {
        setLoadingAgents(true)
        setError(null)
        
        console.log('Buscando agentes para a clínica:', clinicId)
        const clinicAgents = await agentsService.getClinicAgents(clinicId)
        
        setAllAgents(clinicAgents)
      } catch (err) {
        console.error(`Erro ao buscar agentes da clínica ${clinicId}:`, err)
        setError('Erro ao carregar agentes')
      } finally {
        setLoadingAgents(false)
      }
    }

    fetchClinicAgents()
  }, [clinicId])

  // Validar e limpar agentes selecionados que não pertencem à clínica atual
  useEffect(() => {
    if (!loadingAgents && allAgents.length >= 0 && selectedAgentIds.length > 0) {
      // Verificar se algum agente selecionado não existe na lista de agentes da clínica
      const validAgentIds = allAgents.map(agent => agent.botModelId)
      const invalidSelections = selectedAgentIds.filter(id => !validAgentIds.includes(id))
      
      if (invalidSelections.length > 0) {
        console.log('Removendo agentes selecionados que não pertencem a esta clínica:', invalidSelections)
        // Atualizar para manter apenas os agentes válidos
        const validSelections = selectedAgentIds.filter(id => validAgentIds.includes(id))
        updateFormData({ 
          selectedAgentIds: validSelections,
          selectedAgentsData: validSelections.length > 0 ? undefined : []
        })
      }
    }
  }, [loadingAgents, allAgents, selectedAgentIds, updateFormData])

  const agentsPerPage = 6
  const totalPages = Math.ceil(allAgents.length / agentsPerPage)
  
  const getCurrentPageAgents = () => {
    const start = currentPage * agentsPerPage
    const end = start + agentsPerPage
    return allAgents.slice(start, end)
  }

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleAgentToggle = (agent: Agent) => {
    const agentData = {
      botModelId: agent.botModelId,
      departmentId: agent.departmentId,
      departmentName: agent.departmentName,
      botName: agent.botName,
      clinicId: '',
    }
    
    toggleAgentSelection(agent.botModelId, agentData)
  }

  const handleNext = () => {
    if (selectedAgentIds.length > 0) {
      updateFormData({ step: 1, clinicId })
      navigate(`/dashboard/clinic/${clinicId}/channels/create/meta-connection`)
    }
  }

  const handleBack = () => {
    navigate(`/dashboard/clinic/${clinicId}/channels/create/type`)
  }

  const handleCreateAgent = () => {
    navigate(`/dashboard/clinic/${clinicId}/agents/create`)
  }

  const canProceed = selectedAgentIds.length > 0

  const currentAgents = getCurrentPageAgents()

  // Debug: log dos agentes selecionados
  console.log('SelectAgentsPage - Estado atual:', {
    clinicId,
    selectedAgentIds,
    totalAgents: allAgents.length,
    loadingAgents
  })

  return (
    <div className="max-w-7xl h-[calc(100vh-80px)] flex flex-col -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      <div className="flex flex-col mb-1">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Criar Novo Canal
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{clinicName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Configure um novo canal de comunicação para seus agentes</p>
        
        <div className="w-full mb-6">
          <MultiStepChannel 
            currentStep={2} 
            className="max-w-full"
          />
        </div>
        
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-medium text-gray-800">Selecionar Agentes</h2>
        </div>
        
        <p className="text-sm text-gray-500 mb-1">
          Etapa 2: Escolha os agentes que serão conectados ao canal (você pode selecionar múltiplos agentes)
        </p>
      </div>

      <div className="mb-2">
        {loadingAgents ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse space-y-4">
              <div className="flex space-x-10">
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
              </div>
              <p className="text-center text-gray-500">Carregando agentes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : allAgents.length === 0 ? (
          <div className="overflow-x-auto overflow-y-hidden py-1">
            <div className="flex gap-5 min-w-max px-1 py-1">
              <AddAgentCard onClick={handleCreateAgent} />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden py-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
            <div className="flex gap-5 min-w-max px-1 py-1">
              <AddAgentCard onClick={handleCreateAgent} />
              
              {currentAgents.map((agent) => {
                const isSelected = selectedAgentIds.includes(agent.botModelId)
                if (isSelected) {
                  console.log(`Agente ${agent.botModelId} está marcado como selecionado`)
                }
                return (
                  <SelectableAgentCard
                    key={agent.botModelId}
                    agent={agent}
                    selected={isSelected}
                    onClick={() => handleAgentToggle(agent)}
                  />
                )
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-2 space-x-4">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-1" />
                  Anterior
                </button>
                
                <span className="text-sm text-gray-600">
                  Página {currentPage + 1} de {totalPages}
                </span>
                
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {selectedAgentIds.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          {selectedAgentIds.length} agente{selectedAgentIds.length > 1 ? 's' : ''} selecionado{selectedAgentIds.length > 1 ? 's' : ''}
        </div>
      )}
      
      <div className="flex mt-4">
        <button
          onClick={handleBack}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          onClick={handleNext}
          className="px-5 py-2 rounded-md text-white transition-colors"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)',
            opacity: canProceed ? 1 : 0.7 
          }}
          disabled={!canProceed || loadingAgents}
        >
          Próximo
        </button>
      </div>
    </div>
  )
}