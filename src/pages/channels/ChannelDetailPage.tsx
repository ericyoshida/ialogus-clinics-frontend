import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IalogusButton } from '@/components/ui/ialogus-button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useAgents } from '@/hooks/use-agents'
import { useChannels } from '@/hooks/use-channels'
import { useClinics } from '@/hooks/use-clinics'
import { cn } from '@/lib/utils'
import { channelsService } from '@/services/channels'
import { formatPhoneNumber } from '@/utils/phone'
import {
    ArrowLeftIcon,
    ChartBarIcon,
    ChartBarSquareIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ClockIcon,
    Cog6ToothIcon,
    PencilIcon,
    PlusIcon,
    UserGroupIcon,
    XCircleIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

// Componente do ícone do WhatsApp
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={cn("text-green-500", className)}
  >
    <path 
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" 
    />
  </svg>
);

// Componente para exibir métricas com cores vibrantes
function MetricCard({ title, value, subtitle, icon: Icon, trend, color = "orange", isLoading = false }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; isPositive: boolean }
  color?: "orange" | "purple" | "blue" | "red"
  isLoading?: boolean
}) {
  const gradientClasses = {
    orange: "from-[#F6921E] to-[#EE413D]",
    purple: "from-[#D33952] to-[#852492]",
    blue: "from-[#4B14C1] to-[#0000FF]",
    red: "from-[#EE413D] to-[#D33952]"
  }

  return (
    <div className="relative p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">{value}</h2>
                {trend && (
                  <span className={cn(
                    "text-sm font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {trend.isPositive ? "+" : ""}{trend.value}%
                  </span>
                )}
              </>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500">
              {isLoading ? (
                <span className="inline-block h-3 w-32 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                subtitle
              )}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg bg-gradient-to-br text-white", gradientClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// Componente para o card de agente
function AgentCard({ agent, onRemove, isRemoving }: { agent: any; onRemove: () => void; isRemoving?: boolean }) {
  const agentName = agent.botName || 'Agente sem nome';
  const departmentName = agent.departmentName || agent.department || 'Sem departamento';
  
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={agent.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-[#F6921E] to-[#D33952] text-white">
            {agentName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm text-gray-900">{agentName}</p>
          <p className="text-xs text-gray-500">{departmentName}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        disabled={isRemoving}
      >
        {isRemoving ? (
          <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          'Remover'
        )}
      </Button>
    </div>
  )
}

export default function ChannelDetailPage() {
  const navigate = useNavigate()
  const { clinicId, channelId } = useParams<{ clinicId: string; channelId: string }>()
  const { isAuthenticated } = useAuth()
  const { clinics } = useClinics()
  const { channels, refetchChannels } = useChannels(clinicId)
  const { agents } = useAgents(clinicId)
  
  const [channel, setChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [statistics, setStatistics] = useState<any[]>([])
  const [editingReceptionist, setEditingReceptionist] = useState(false)
  const [receptionistName, setReceptionistName] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false)
  const [updatingReceptionist, setUpdatingReceptionist] = useState(false)
  const [updatingAgents, setUpdatingAgents] = useState(false)

  // Buscar dados do canal primeiro (essencial para renderizar a página)
  useEffect(() => {
    async function fetchChannelData() {
      if (channelId) {
        try {
          setLoading(true)
          const channelData = await channelsService.getWhatsAppChannelById(channelId)
          setChannel(channelData)
          setReceptionistName(channelData.botName)
          setSelectedAgents(channelData.botModelsIDList || [])
        } catch (error) {
          console.error('Erro ao buscar dados do canal:', error)
          toast.error('Erro ao carregar dados do canal')
        } finally {
          setLoading(false)
        }
      }
    }
    
    fetchChannelData()
  }, [channelId])
  
  // Buscar métricas e estatísticas em paralelo após o canal estar carregado
  useEffect(() => {
    async function fetchMetricsAndStats() {
      if (channelId && channel) {
        try {
          // Busca métricas e estatísticas em paralelo
          const promises = []
          
          // Buscar métricas
          promises.push(
            channelsService.getWhatsAppChannelMetrics(channelId)
              .then(data => {
                setMetrics(data)
                setLoadingMetrics(false)
              })
              .catch(error => {
                console.error('Erro ao buscar métricas:', error)
                setLoadingMetrics(false)
              })
          )
          
          // Buscar estatísticas
          promises.push(
            channelsService.getWhatsAppChannelStatistics(channelId, 7)
              .then(data => {
                setStatistics(data)
                setLoadingStats(false)
              })
              .catch(error => {
                console.error('Erro ao buscar estatísticas:', error)
                setLoadingStats(false)
              })
          )
          
          await Promise.all(promises)
        } catch (error) {
          console.error('Erro ao buscar métricas e estatísticas:', error)
        }
      }
    }
    
    fetchMetricsAndStats()
  }, [channelId, channel])

  // Formatar tempo médio de resposta
  const formatResponseTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds === null || seconds === undefined) return '0s'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const handleUpdateReceptionist = async () => {
    if (!channel || !clinicId) return;
    
    setUpdatingReceptionist(true)
    
    try {
      // Atualiza o canal com o novo nome do recepcionista
      await channelsService.updateWhatsAppChannel(channel.id, {
        botName: receptionistName,
        // Mantém os outros campos obrigatórios
        phoneNumber: channel.phoneNumber,
        botModelsIds: channel.botModelsIDList,
        additionalInstructions: channel.additionalInstructions,
        operationalRegion: channel.operationalRegion,
        whatsappPhoneNumberId: channel.whatsappPhoneNumberId,
        whatsappBusinessAccountId: channel.whatsappBusinessAccountId || '',
        metaBusinessAccountId: channel.metaBusinessAccountId || '',
        waitTimeoutToEndChatLog: channel.waitTimeoutToEndChatLog || 1440
      })
      
      // Atualiza o estado local
      setChannel({ ...channel, botName: receptionistName })
      
      toast.success('Nome do recepcionista atualizado')
      setEditingReceptionist(false)
      
      // Recarrega os canais para manter a lista atualizada
      refetchChannels(clinicId)
    } catch (error) {
      console.error('Erro ao atualizar nome do recepcionista:', error)
      toast.error('Erro ao atualizar nome do recepcionista')
      // Reverte o nome em caso de erro
      setReceptionistName(channel.botName)
    } finally {
      setUpdatingReceptionist(false)
    }
  }

  const handleAddAgent = async (agentId: string) => {
    if (!selectedAgents.includes(agentId) && channel && clinicId) {
      setUpdatingAgents(true)
      
      try {
        const newAgentsList = [...selectedAgents, agentId]
        
        // Atualiza o canal com a nova lista de agentes
        await channelsService.updateWhatsAppChannel(channel.id, {
          botModelsIds: newAgentsList,
          // Mantém os outros campos obrigatórios
          botName: channel.botName,
          phoneNumber: channel.phoneNumber,
          additionalInstructions: channel.additionalInstructions,
          operationalRegion: channel.operationalRegion,
          whatsappPhoneNumberId: channel.whatsappPhoneNumberId,
          whatsappBusinessAccountId: channel.whatsappBusinessAccountId || '',
          metaBusinessAccountId: channel.metaBusinessAccountId || '',
          waitTimeoutToEndChatLog: channel.waitTimeoutToEndChatLog || 1440
        })
        
        // Atualiza o estado local
        setSelectedAgents(newAgentsList)
        setChannel({ ...channel, botModelsIDList: newAgentsList })
        
        toast.success('Agente adicionado ao canal')
        
        // Recarrega os canais para manter a lista atualizada
        refetchChannels(clinicId)
      } catch (error) {
        console.error('Erro ao adicionar agente:', error)
        toast.error('Erro ao adicionar agente ao canal')
      } finally {
        setUpdatingAgents(false)
      }
    }
  }

  const handleRemoveAgent = async (agentId: string) => {
    if (channel && clinicId) {
      setUpdatingAgents(true)
      
      try {
        const newAgentsList = selectedAgents.filter(id => id !== agentId)
        
        // Atualiza o canal com a nova lista de agentes
        await channelsService.updateWhatsAppChannel(channel.id, {
          botModelsIds: newAgentsList,
          // Mantém os outros campos obrigatórios
          botName: channel.botName,
          phoneNumber: channel.phoneNumber,
          additionalInstructions: channel.additionalInstructions,
          operationalRegion: channel.operationalRegion,
          whatsappPhoneNumberId: channel.whatsappPhoneNumberId,
          whatsappBusinessAccountId: channel.whatsappBusinessAccountId || '',
          metaBusinessAccountId: channel.metaBusinessAccountId || '',
          waitTimeoutToEndChatLog: channel.waitTimeoutToEndChatLog || 1440
        })
        
        // Atualiza o estado local
        setSelectedAgents(newAgentsList)
        setChannel({ ...channel, botModelsIDList: newAgentsList })
        
        toast.success('Agente removido do canal')
        
        // Recarrega os canais para manter a lista atualizada
        refetchChannels(clinicId)
      } catch (error) {
        console.error('Erro ao remover agente:', error)
        toast.error('Erro ao remover agente do canal')
      } finally {
        setUpdatingAgents(false)
      }
    }
  }

  const getConnectedAgents = () => {
    return agents.filter(agent => selectedAgents.includes(agent.botModelId))
  }

  const getAvailableAgents = () => {
    return agents.filter(agent => !selectedAgents.includes(agent.botModelId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-4">Canal não encontrado</p>
        <IalogusButton onClick={() => navigate(-1)} variant="outline">
          Voltar
        </IalogusButton>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{channel.botName}</h1>
              <Badge 
                variant={channel.whatsappPhoneNumberId ? 'default' : 'secondary'}
                className={channel.whatsappPhoneNumberId ? 'bg-green-100 text-green-700 border-green-200' : ''}
              >
                {channel.whatsappPhoneNumberId ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <WhatsAppIcon className="h-4 w-4" />
              {formatPhoneNumber(channel.phoneNumber)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <IalogusButton variant="outline">
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar Conexão
          </IalogusButton>
          <IalogusButton variant="auth-gradient-no-blue">
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            Ver Conversas
          </IalogusButton>
        </div>
      </div>

      {/* Métricas com cores vibrantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Conversas"
          value={metrics?.totalConversations?.toLocaleString() || '0'}
          subtitle="Histórico total"
          icon={ChatBubbleLeftRightIcon}
          trend={metrics?.conversationTrend ? { value: metrics.conversationTrend, isPositive: metrics.conversationTrend > 0 } : undefined}
          color="orange"
          isLoading={loadingMetrics}
        />
        <MetricCard
          title="Conversas Ativas"
          value={metrics?.activeConversations || 0}
          subtitle="Em andamento agora"
          icon={UserGroupIcon}
          color="purple"
          isLoading={loadingMetrics}
        />
        <MetricCard
          title="Tempo Médio de Resposta"
          value={formatResponseTime(metrics?.averageResponseTime || 0)}
          subtitle="Últimas conversas"
          icon={ClockIcon}
          color="blue"
          isLoading={loadingMetrics}
        />
        <MetricCard
          title="Total de Mensagens"
          value={metrics?.totalMessages?.toLocaleString() || '0'}
          subtitle={`${metrics?.messagesFromCustomers || 0} recebidas, ${metrics?.messagesFromAgents || 0} enviadas`}
          icon={ChartBarIcon}
          trend={metrics?.messageTrend ? { value: metrics.messageTrend, isPositive: metrics.messageTrend > 0 } : undefined}
          color="red"
          isLoading={loadingMetrics}
        />
      </div>

      {/* Tabs de conteúdo */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-4 bg-gray-100/50">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Tab de Informações */}
        <TabsContent value="info" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Informações do Canal</h2>
              <p className="text-sm text-gray-500 mt-1">Detalhes e configurações básicas do canal WhatsApp</p>
            </div>
            
            <div className="space-y-6">
              {/* Nome do Recepcionista */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome do Recepcionista</label>
                {editingReceptionist ? (
                  <div className="flex items-center gap-2">
                    <IalogusInput
                      value={receptionistName}
                      onChange={(e) => setReceptionistName(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleUpdateReceptionist} 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updatingReceptionist}
                    >
                      {updatingReceptionist ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingReceptionist(false)
                        setReceptionistName(channel.botName)
                      }}
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">{receptionistName}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingReceptionist(true)}
                      className="text-[#F6921E] hover:text-[#EE413D]"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="bg-gray-200" />

              {/* Informações da Conexão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Número WhatsApp</label>
                  <div className="flex items-center gap-2">
                    <WhatsAppIcon className="h-4 w-4" />
                    <p className="text-sm text-gray-900">{formatPhoneNumber(channel.phoneNumber)}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Região Operacional</label>
                  <p className="text-sm text-gray-900">{channel.operationalRegion}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ID da Conta Meta</label>
                  <p className="text-sm font-mono text-xs bg-gray-100 p-2 rounded">{channel.whatsappPhoneNumberId}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Criado em</label>
                  <p className="text-sm text-gray-900">
                    {new Date(channel.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <Separator className="bg-gray-200" />

              {/* Instruções Adicionais */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instruções Adicionais</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {channel.additionalInstructions || 'Nenhuma instrução adicional configurada'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab de Agentes */}
        <TabsContent value="agents" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Agentes Conectados</h2>
                <p className="text-sm text-gray-500 mt-1">Gerencie os agentes que podem atender neste canal</p>
              </div>
              <IalogusButton onClick={() => setShowAddAgentDialog(true)} variant="auth-gradient-no-blue" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Agente
              </IalogusButton>
            </div>
            
            {getConnectedAgents().length > 0 ? (
              <div className="space-y-2">
                {getConnectedAgents().map((agent) => (
                  <AgentCard
                    key={agent.botModelId}
                    agent={agent}
                    onRemove={() => handleRemoveAgent(agent.botModelId)}
                    isRemoving={updatingAgents}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum agente conectado</p>
                <IalogusButton
                  variant="outline"
                  onClick={() => setShowAddAgentDialog(true)}
                  className="mt-4"
                  size="sm"
                >
                  Adicionar primeiro agente
                </IalogusButton>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab de Estatísticas */}
        <TabsContent value="stats" className="space-y-4">
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, idx) => (
                <div key={idx} className="animate-pulse">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 w-32 bg-gray-200 rounded"></div>
                      <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-12 bg-gray-200 rounded-lg"></div>
                      <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Volume de Mensagens</h3>
                  <div className="p-2 bg-gradient-to-br from-[#F6921E] to-[#EE413D] rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Mensagens Recebidas</span>
                    <span className="text-sm font-bold text-gray-900">{metrics?.messagesReceived?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Mensagens Enviadas</span>
                    <span className="text-sm font-bold text-gray-900">{metrics?.messagesSent?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Performance</h3>
                  <div className="p-2 bg-gradient-to-br from-[#852492] to-[#4B14C1] rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Taxa de Resposta</span>
                    <span className="text-sm font-bold text-gray-900">98.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Conversas Resolvidas</span>
                    <span className="text-sm font-bold text-gray-900">89.2%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab de Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Configurações Avançadas</h2>
              <p className="text-sm text-gray-500 mt-1">Personalize o comportamento e as integrações do canal</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 border border-gray-200 rounded-xl bg-white">
                <div>
                  <p className="font-medium text-gray-900">Conexão Meta Business</p>
                  <p className="text-sm text-gray-500">Gerencie a integração com o WhatsApp Business API</p>
                </div>
                <IalogusButton variant="outline" size="sm">
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Configurar
                </IalogusButton>
              </div>
              
              <div className="flex items-center justify-between p-5 border border-gray-200 rounded-xl bg-white">
                <div>
                  <p className="font-medium text-gray-900">Webhooks</p>
                  <p className="text-sm text-gray-500">Configure notificações e integrações externas</p>
                </div>
                <IalogusButton variant="outline" size="sm">
                  <ChartBarSquareIcon className="h-4 w-4 mr-2" />
                  Configurar
                </IalogusButton>
              </div>
              
              <div className="flex items-center justify-between p-5 border border-gray-200 rounded-xl bg-white">
                <div>
                  <p className="font-medium text-gray-900">Horário de Atendimento</p>
                  <p className="text-sm text-gray-500">Defina quando o canal está disponível</p>
                </div>
                <IalogusButton variant="outline" size="sm">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Configurar
                </IalogusButton>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar agente */}
      <Dialog open={showAddAgentDialog} onOpenChange={setShowAddAgentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Agente ao Canal</DialogTitle>
            <DialogDescription>
              Selecione os agentes que poderão atender neste canal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getAvailableAgents().length > 0 ? (
              getAvailableAgents().map((agent) => (
                <div
                  key={agent.botModelId}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    handleAddAgent(agent.botModelId)
                    setShowAddAgentDialog(false)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={agent.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-[#F6921E] to-[#D33952] text-white text-xs">
                        {(agent.botName || 'A').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{agent.botName || 'Agente sem nome'}</p>
                      <p className="text-xs text-gray-500">{agent.departmentName || 'Sem departamento'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                Todos os agentes já estão conectados a este canal
              </p>
            )}
          </div>
          <DialogFooter>
            <IalogusButton variant="outline" onClick={() => setShowAddAgentDialog(false)}>
              Cancelar
            </IalogusButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}