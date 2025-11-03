import { agentsService } from '@/services'
import type { Agent } from '@/services/agents'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function AgentDetailPage() {
  const navigate = useNavigate()
  const { clinicId, agentId } = useParams<{ clinicId: string; agentId: string }>()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (!agentId || !clinicId) {
        setError('ID do agente ou clínica não fornecido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Buscar detalhes do agente específico
        const agentData = await agentsService.getAgentById(clinicId, agentId)
        setAgent(agentData)
      } catch (err) {
        console.error('Erro ao buscar detalhes do agente:', err)
        setError('Erro ao carregar detalhes do agente')
      } finally {
        setLoading(false)
      }
    }

    fetchAgentDetails()
  }, [agentId, clinicId])

  const handleBack = () => {
    navigate(`/dashboard/clinic/${clinicId}/agents`)
  }

  if (loading) {
    return (
      <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="w-64 h-8 bg-gray-200 rounded"></div>
            <div className="w-96 h-6 bg-gray-200 rounded"></div>
            <div className="w-full h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error || 'Agente não encontrado'}</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            Voltar para lista de agentes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Voltar
        </button>
        
        <div>
          <h1 className="text-[21px] font-medium text-gray-900">
            Detalhes do Agente
          </h1>
          <p className="text-gray-500 text-sm">Informações e configurações do agente</p>
        </div>
      </div>

      {/* Agent Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Agent Info */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {agent.agentName}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Agente de IA
                </span>
              </div>
            </div>

            {/* Agent Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">
                  {agent.todayActiveConversationsCount || 0}
                </div>
                <div className="text-sm text-gray-600">Conversas Hoje</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">
                  {agent.connectedChannels?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Canais Conectados</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">
                  Ativo
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>

            {/* Connected Channels */}
            {agent.connectedChannels && agent.connectedChannels.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Canais Conectados</h3>
                <div className="space-y-2">
                  {agent.connectedChannels.map((channel, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">{channel.channelType}</span>
                      <span className="text-gray-600 text-sm">• {channel.channelName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent ID */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informações Técnicas</h3>
              <div className="text-sm text-gray-600">
                <div className="mb-1">ID do Agente: <code className="bg-gray-100 px-2 py-1 rounded">{agent.agentId}</code></div>
                <div>ID da Clínica: <code className="bg-gray-100 px-2 py-1 rounded">{agent.clinicId}</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
          Editar Agente
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          Ver Conversas
        </button>
        <button className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors">
          Desativar Agente
        </button>
      </div>
    </div>
  )
} 