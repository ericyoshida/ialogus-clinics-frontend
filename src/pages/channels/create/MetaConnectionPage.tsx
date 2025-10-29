import { EmbeddedSignup } from '@/components/channels/EmbeddedSignup'
import { MultiStepChannel } from '@/components/multi-step-channel'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { useChannelCreationForm } from '@/hooks/use-channel-creation-form'
import { useClinics } from '@/hooks/use-clinics'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services/channels'
import { formatPhoneNumber, sanitizePhoneNumber } from '@/utils/phone'
import { ArrowTopRightOnSquareIcon, ArrowsRightLeftIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type AuthMethod = 'embedded' | 'oauth'

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
  
  const [authMethod, setAuthMethod] = useState<AuthMethod>('embedded')
  const [isConnecting, setIsConnecting] = useState(false)
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

  const handleOAuthConnect = async () => {
    setIsConnecting(true)

    try {
      // Salvar o token e usuário atual no sessionStorage antes de redirecionar
      const currentToken = localStorage.getItem('ialogus:token')
      const currentUser = localStorage.getItem('ialogus:user')
      if (currentToken) {
        sessionStorage.setItem('ialogus:oauth:token', currentToken)
        console.log('🔐 Token salvo no sessionStorage para OAuth')
      }
      if (currentUser) {
        sessionStorage.setItem('ialogus:oauth:user', currentUser)
        console.log('👤 Usuário salvo no sessionStorage para OAuth')
      }

      // Obter URL de autorização do backend
      const { authUrl } = await channelsService.initiateMetaOAuth(clinicId || savedClinicId)

      // Adicionar/substituir config_id e app_id corretos
      const urlWithState = new URL(authUrl)

      // Garantir que usa o App ID e Config ID corretos para OAuth
      urlWithState.searchParams.set('client_id', '1141048344552370')
      urlWithState.searchParams.set('config_id', '1152173283136317')

      // Adicionar o estado atual como parâmetro na URL (fallback)
      const stateData = {
        token: currentToken,
        user: currentUser,
        clinicId: clinicId || savedClinicId,
        timestamp: Date.now()
      }
      console.log('📦 Enviando estado para OAuth:', stateData)
      const state = btoa(JSON.stringify(stateData))
      urlWithState.searchParams.set('app_state', state)

      console.log('🌐 Redirecionando para:', urlWithState.toString())
      console.log('📋 Config ID usado:', urlWithState.searchParams.get('config_id'))

      // Redirecionar para o Meta
      window.location.href = urlWithState.toString()
    } catch (error) {
      toast({
        title: "Erro ao iniciar conexão",
        description: "Não foi possível iniciar a conexão com o Meta Business.",
        variant: "destructive"
      })
      setIsConnecting(false)
    }
  }

  const handleSwitchAuthMethod = () => {
    setAuthMethod(authMethod === 'embedded' ? 'oauth' : 'embedded')
    // Clear any existing auth data when switching
    setEmbeddedSignupData(null)
    updateFormData({
      selectedPhoneNumberId: undefined,
      selectedPhoneNumber: undefined,
      selectedBusinessAccountId: undefined,
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
        botModelsIds: selectedAgentIds,
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
          {!isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchAuthMethod}
              className="flex items-center gap-2"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
              {authMethod === 'embedded' ? 'Usar OAuth' : 'Usar Embedded'}
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-1">
          Etapa 3: Conecte sua conta do Meta Business e configure o WhatsApp
          {authMethod === 'embedded' && ' (Método Popup)'}
          {authMethod === 'oauth' && ' (Método Redirect)'}
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
          authMethod === 'embedded' ? (
            // Embedded Signup Flow (Popup)
            <EmbeddedSignup
              clinicId={clinicId || savedClinicId || ''}
              onSuccess={handleEmbeddedSignupSuccess}
              onError={(error) => {
                console.error('Erro no Embedded Signup:', error)
              }}
            />
          ) : (
            // OAuth Redirect Flow (Nova Guia)
            <>
              <Alert className="mb-6">
                <InformationCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  Você será redirecionado para o Meta Business para autorizar a conexão.
                  Certifique-se de ter acesso à conta do WhatsApp Business que deseja conectar.
                </AlertDescription>
              </Alert>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Pré-requisitos</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Conta verificada no Meta Business
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    WhatsApp Business API configurado
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Permissões de administrador na conta
                  </li>
                </ul>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleOAuthConnect}
                  disabled={isConnecting}
                  className="bg-[#1877F2] hover:bg-[#1864D9] text-white px-8 py-3 text-base"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
                      Conectar com Meta Business
                    </>
                  )}
                </Button>
              </div>
            </>
          )
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