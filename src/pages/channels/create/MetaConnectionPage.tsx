import { EmbeddedSignup } from '@/components/channels/EmbeddedSignup'
import { MultiStepChannel } from '@/components/multi-step-channel'
import { Button } from '@/components/ui/button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { useChannelCreationForm } from '@/hooks/use-channel-creation-form'
import { useClinics } from '@/hooks/use-clinics'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services/channels'
import { formatPhoneNumber, sanitizePhoneNumber } from '@/utils/phone'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function MetaConnectionPage() {
  const navigate = useNavigate()
  const { clinicId } = useParams<{ clinicId: string }>()
  const { toast } = useToast()
  const { clinics } = useClinics()
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...'
  const { 
    selectedAgentIds, 
    channelName,
    clinicId: savedClinicId,
    updateFormData, 
    clearFormData 
  } = useChannelCreationForm()
  
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [embeddedSignupData, setEmbeddedSignupData] = useState<{
    accessToken: string
    wabaId: string
    phoneNumberId: string
    phoneNumber: string
  } | null>(null)

  // Estados para seleção
  const [localChannelName, setLocalChannelName] = useState(channelName || '')
  
  // Salvar clinicId no estado quando montar o componente
  useEffect(() => {
    if (clinicId && clinicId !== savedClinicId) {
      updateFormData({ clinicId })
    }
  }, [clinicId, savedClinicId, updateFormData])
  
  // Verificar se está autenticado
  const isAuthenticated = !!embeddedSignupData
  
  const handleEmbeddedSignupSuccess = (data: {
    accessToken: string
    wabaId: string
    phoneNumberId: string
    phoneNumber: string
  }) => {
    console.log('✅ Embedded Signup success:', data)
    setEmbeddedSignupData(data)
    // Atualizar form data
    updateFormData({
      selectedPhoneNumberId: data.phoneNumberId,
      selectedPhoneNumber: data.phoneNumber,
      selectedBusinessAccountId: data.wabaId
    })
  }

  const handleComplete = async () => {
    // Validação
    if (!embeddedSignupData || !localChannelName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, conecte o WhatsApp e preencha o nome do canal.",
        variant: "destructive"
      })
      return
    }
    
    setIsCreatingChannel(true)
    
    try {
      // Usar o ID da clínica da URL
      if (!clinicId) {
        toast({
          title: "Erro",
          description: "Nenhuma clínica selecionada. Por favor, selecione uma clínica.",
          variant: "destructive"
        })
        return
      }
      
      // Usar dados do Embedded Signup
      const sanitizedPhoneNumber = sanitizePhoneNumber(embeddedSignupData.phoneNumber)
      console.log('Número original (Embedded):', embeddedSignupData.phoneNumber)
      console.log('Número sanitizado:', sanitizedPhoneNumber)
      
      const channelData = {
        phoneNumber: sanitizedPhoneNumber,
        agentsIds: selectedAgentIds, // Fixed: backend expects "agentsIds"
        additionalInstructions: '',
        operationalRegion: 'BR',
        whatsappPhoneNumberId: embeddedSignupData.phoneNumberId,
        whatsappBusinessAccountId: embeddedSignupData.wabaId,
        metaBusinessAccountId: embeddedSignupData.wabaId,
        botName: localChannelName,
        waitTimeoutToEndChatLog: 300,
        isEmbeddedSignup: true,
        embeddedAccessToken: embeddedSignupData.accessToken
      }
      
      // Criar canal com todos os dados
      await channelsService.createWhatsAppChannel(clinicId, channelData)
      
      toast({
        title: "Canal criado com sucesso!",
        description: "Seu canal WhatsApp foi configurado e está pronto para uso.",
      })
      
      // Limpar dados do formulário
      clearFormData()
      
      // Redirecionar para a página de sucesso
      navigate(`/dashboard/clinic/${clinicId}/channels/create/success`)
    } catch (error: any) {
      console.error('Erro ao criar canal:', error)
      
      let errorMessage = "Não foi possível criar o canal. Verifique os dados e tente novamente."
      
      // Verificar se é um erro específico do backend
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast({
        title: "Erro ao criar canal",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsCreatingChannel(false)
    }
  }
  
  const handleBack = () => {
    navigate(`/dashboard/clinic/${clinicId}/channels/create/agents`)
  }
  
  // Verificar se pode prosseguir
  const canComplete = embeddedSignupData && localChannelName.trim()
  
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
            currentStep={3} 
            className="max-w-full"
          />
        </div>
        
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-medium text-gray-800">Conectar com WhatsApp Business</h2>
        </div>

        <p className="text-sm text-gray-500 mb-1">
          Etapa 3: Conecte sua conta do Meta Business e configure o WhatsApp (Embedded Signup)
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full mt-8 space-y-6">
        {/* Nome do Canal - Sempre visível */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Nome do Canal *
          </label>
          <IalogusInput
            value={localChannelName}
            onChange={(e) => {
              setLocalChannelName(e.target.value)
              updateFormData({ channelName: e.target.value })
            }}
            placeholder="Ex: Suporte WhatsApp Principal"
            className="w-full"
            required
          />
          <p className="text-xs text-gray-500">
            Este nome será usado para identificar o canal na plataforma
          </p>
        </div>

        {!isAuthenticated ? (
          // Embedded Signup Flow (Popup)
          <EmbeddedSignup
            clinicId={clinicId || savedClinicId || ''}
            onSuccess={handleEmbeddedSignupSuccess}
            onError={(error) => {
              console.error('Erro no Embedded Signup:', error)
            }}
          />
        ) : (
          // Embedded Signup - Conectado
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      WhatsApp Business conectado com sucesso
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Número: {formatPhoneNumber(embeddedSignupData.phoneNumber)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEmbeddedSignupData(null)
                    updateFormData({
                      selectedPhoneNumberId: undefined,
                      selectedPhoneNumber: undefined,
                      selectedBusinessAccountId: undefined,
                    })
                  }}
                  className="text-xs text-green-700 hover:text-green-900 underline"
                >
                  Reconectar
                </button>
              </div>
            </div>

            {/* Resumo da configuração */}
            {canComplete && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900 mb-2">Resumo da Configuração</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agentes selecionados:</span>
                    <span className="font-medium">{selectedAgentIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome do canal:</span>
                    <span className="font-medium">{localChannelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número WhatsApp:</span>
                    <span className="font-medium">{formatPhoneNumber(embeddedSignupData.phoneNumber)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de conexão:</span>
                    <span className="font-medium">Coexistência (Embedded Signup)</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleComplete}
                disabled={!canComplete || isCreatingChannel}
                className="px-8 py-3 text-base"
                style={{ 
                  background: canComplete 
                    ? 'linear-gradient(90deg, #F6921E, #EE413D)'
                    : undefined,
                  opacity: canComplete ? 1 : 0.5
                }}
              >
                {isCreatingChannel ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando canal...
                  </>
                ) : (
                  'Concluir Configuração'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
      
      <div className="flex mt-auto">
        <button
          onClick={handleBack}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isCreatingChannel}
        >
          Voltar
        </button>
      </div>
    </div>
  )
}
