import { MultiStepChannel } from '@/components/multi-step-channel'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { EmbeddedSignup } from '@/components/whatsapp/EmbeddedSignup'
import { useChannelCreationForm } from '@/hooks/use-channel-creation-form'
import { useClinics } from '@/hooks/use-clinics'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services/channels'
import { formatPhoneNumber, sanitizePhoneNumber } from '@/utils/phone'
import { ArrowTopRightOnSquareIcon, CheckCircleIcon, InformationCircleIcon, SwitchHorizontalIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type AuthMethod = 'embedded' | 'oauth'

export default function EmbeddedMetaConnectionPage() {
  const navigate = useNavigate()
  const { clinicId } = useParams<{ clinicId: string }>()
  const { toast } = useToast()
  const { clinics } = useClinics()
  const clinicName = clinics.find(c => c.id === clinicId)?.name || 'Carregando...'
  const { 
    selectedAgentIds, 
    metaAuthData,
    businessAccounts,
    selectedBusinessAccountId,
    whatsappNumbers,
    selectedPhoneNumberId,
    selectedPhoneNumber,
    channelName,
    clinicId: savedClinicId,
    updateFormData, 
    clearFormData 
  } = useChannelCreationForm()
  
  const [authMethod, setAuthMethod] = useState<AuthMethod>('embedded')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false)
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [numbersAvailability, setNumbersAvailability] = useState<Record<string, { inUse: boolean; channelName?: string }>>({})
  
  // Estados para seleção
  const [localChannelName, setLocalChannelName] = useState(channelName || '')
  const [embeddedAccessToken, setEmbeddedAccessToken] = useState<string | null>(null)
  
  // Salvar clinicId no estado quando montar o componente
  useEffect(() => {
    if (clinicId && clinicId !== savedClinicId) {
      updateFormData({ clinicId })
    }
  }, [clinicId, savedClinicId, updateFormData])
  
  // Verificar se está autenticado
  const isAuthenticated = !!metaAuthData?.accessToken && !!businessAccounts
  
  // Carregar business accounts se estiver autenticado mas sem accounts
  useEffect(() => {
    const loadBusinessAccounts = async () => {
      if (metaAuthData?.accessToken && (!businessAccounts || businessAccounts.length === 0)) {
        try {
          const accounts = await channelsService.getMetaBusinessAccounts()
          updateFormData({ businessAccounts: accounts })
        } catch (error) {
          console.error('Erro ao carregar business accounts:', error)
          // Se falhar, não fazer nada - o usuário pode tentar reconectar
        }
      }
    }
    
    loadBusinessAccounts()
  }, [metaAuthData])
  
  // Carregar números quando selecionar uma conta
  useEffect(() => {
    const loadPhoneNumbers = async () => {
      if (!selectedBusinessAccountId || !isAuthenticated) return
      
      setIsLoadingNumbers(true)
      try {
        const numbers = await channelsService.getWhatsAppNumbers(selectedBusinessAccountId)
        updateFormData({ whatsappNumbers: numbers })
        
        // Verificar disponibilidade dos números
        if (numbers.length > 0) {
          const numberIds = numbers.map(n => n.id)
          const availability = await channelsService.checkWhatsAppNumbersAvailability(numberIds)
          setNumbersAvailability(availability)
        }
      } catch (error) {
        toast({
          title: "Erro ao carregar números",
          description: "Não foi possível carregar os números WhatsApp desta conta.",
          variant: "destructive"
        })
      } finally {
        setIsLoadingNumbers(false)
      }
    }
    
    loadPhoneNumbers()
  }, [selectedBusinessAccountId, isAuthenticated, updateFormData, toast])
  
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
      
      // Adicionar o estado atual como parâmetro na URL (fallback)
      const urlWithState = new URL(authUrl)
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

  const handleEmbeddedSignupSuccess = async (signupData: any) => {
    console.log('🎉 Embedded signup successful:', signupData)
    
    // Store the access token for channel creation
    setEmbeddedAccessToken(signupData.accessToken)
    
    // Update form data with the business accounts
    updateFormData({
      metaAuthData: {
        accessToken: 'embedded_signup_token', // Placeholder
      },
      businessAccounts: signupData.whatsappBusinessAccounts || []
    })
    
    toast({
      title: "Conexão estabelecida!",
      description: "WhatsApp Business conectado com sucesso via Embedded Signup.",
    })
  }

  const handleEmbeddedSignupError = (error: string) => {
    console.error('❌ Embedded signup error:', error)
    toast({
      title: "Erro na conexão",
      description: error,
      variant: "destructive"
    })
  }
  
  const handleBusinessAccountSelect = (accountId: string) => {
    updateFormData({ 
      selectedBusinessAccountId: accountId,
      selectedPhoneNumberId: undefined,
      selectedPhoneNumber: undefined,
      whatsappNumbers: undefined
    })
  }
  
  const handlePhoneNumberSelect = (numberId: string) => {
    const number = whatsappNumbers?.find(n => n.id === numberId)
    if (number) {
      updateFormData({ 
        selectedPhoneNumberId: numberId,
        selectedPhoneNumber: number.displayPhoneNumber
      })
    }
  }
  
  const handleComplete = async () => {
    if (!selectedBusinessAccountId || !selectedPhoneNumberId || !selectedPhoneNumber || !localChannelName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos antes de continuar.",
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
      
      // Sanitizar o número de telefone - remover tudo que não seja dígito
      const sanitizedPhoneNumber = sanitizePhoneNumber(selectedPhoneNumber)
      console.log('Número original:', selectedPhoneNumber)
      console.log('Número sanitizado:', sanitizedPhoneNumber)
      
      const channelData = {
        phoneNumber: sanitizedPhoneNumber,
        botModelsIds: selectedAgentIds,
        additionalInstructions: '',
        operationalRegion: 'BR',
        whatsappPhoneNumberId: selectedPhoneNumberId,
        whatsappBusinessAccountId: selectedBusinessAccountId,
        metaBusinessAccountId: selectedBusinessAccountId,
        botName: localChannelName,
        waitTimeoutToEndChatLog: 300, // 5 minutos padrão
        embeddedAccessToken: embeddedAccessToken || undefined
      }
      
      // Choose the appropriate endpoint based on auth method
      let createdChannel
      if (embeddedAccessToken) {
        // Use embedded signup flow
        createdChannel = await channelsService.createWhatsAppChannelEmbedded(clinicId, channelData)
      } else {
        // Use regular OAuth flow
        createdChannel = await channelsService.createWhatsAppChannel(clinicId, channelData)
      }
      
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

  const handleSwitchAuthMethod = () => {
    setAuthMethod(authMethod === 'embedded' ? 'oauth' : 'embedded')
    // Clear any existing auth data when switching
    updateFormData({
      metaAuthData: undefined,
      authCode: undefined,
      businessAccounts: undefined,
      selectedBusinessAccountId: undefined,
      whatsappNumbers: undefined,
      selectedPhoneNumberId: undefined,
      selectedPhoneNumber: undefined,
    })
    setEmbeddedAccessToken(null)
  }
  
  // Verificar se pode prosseguir
  const canComplete = isAuthenticated && 
    selectedBusinessAccountId && 
    selectedPhoneNumberId && 
    localChannelName.trim()
  
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
              <SwitchHorizontalIcon className="w-4 h-4" />
              {authMethod === 'embedded' ? 'Usar OAuth' : 'Usar Embedded'}
            </Button>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mb-1">
          Etapa 3: Conecte sua conta do Meta Business e configure o WhatsApp
          {authMethod === 'embedded' && ' (Método Avançado)'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full mt-8 space-y-6">
        {!isAuthenticated ? (
          authMethod === 'embedded' ? (
            // Embedded Signup Flow
            <EmbeddedSignup
              clinicId={clinicId || savedClinicId || ''}
              onSuccess={handleEmbeddedSignupSuccess}
              onError={handleEmbeddedSignupError}
            />
          ) : (
            // Traditional OAuth Flow
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
          // Configuration phase after authentication
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Autorização concluída com sucesso
                    {embeddedAccessToken && ' (Embedded Signup)'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    updateFormData({
                      metaAuthData: undefined,
                      authCode: undefined,
                      businessAccounts: undefined,
                      selectedBusinessAccountId: undefined,
                      whatsappNumbers: undefined,
                      selectedPhoneNumberId: undefined,
                      selectedPhoneNumber: undefined,
                    })
                    setEmbeddedAccessToken(null)
                  }}
                  className="text-xs text-green-700 hover:text-green-900 underline"
                >
                  Reconectar
                </button>
              </div>
            </div>
            
            {/* Nome do Canal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nome do Canal
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
            
            {/* Seleção de Conta Business */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Conta Meta Business
              </label>
              {businessAccounts && businessAccounts.length > 0 ? (
                <div className="space-y-2">
                  {businessAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handleBusinessAccountSelect(account.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedBusinessAccountId === account.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{account.name}</p>
                          <p className="text-sm text-gray-500">
                            Status: {account.verificationStatus}
                          </p>
                        </div>
                        {selectedBusinessAccountId === account.id && (
                          <CheckCircleIcon className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma conta encontrada</p>
              )}
            </div>
            
            {/* Seleção de Número WhatsApp */}
            {selectedBusinessAccountId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Número WhatsApp
                </label>
                {isLoadingNumbers ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : whatsappNumbers && whatsappNumbers.length > 0 ? (
                  <div className="space-y-2">
                    {whatsappNumbers.map((number) => {
                      const isInUse = numbersAvailability[number.id]?.inUse || false
                      const channelName = numbersAvailability[number.id]?.channelName
                      
                      return (
                        <div
                          key={number.id}
                          onClick={() => !isInUse && handlePhoneNumberSelect(number.id)}
                          className={`p-4 border rounded-lg transition-all ${
                            isInUse
                              ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                              : selectedPhoneNumberId === number.id
                              ? 'border-orange-500 bg-orange-50 cursor-pointer'
                              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${isInUse ? 'text-red-900' : 'text-gray-900'}`}>
                                {formatPhoneNumber(number.displayPhoneNumber)}
                              </p>
                              <p className="text-xs text-gray-500">
                                WhatsApp ID: {sanitizePhoneNumber(number.displayPhoneNumber)}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Qualidade: {number.qualityRating}</span>
                                <span>Status: {number.status}</span>
                              </div>
                              {isInUse && (
                                <p className="text-xs text-red-600 mt-1">
                                  Já em uso no canal: {channelName}
                                </p>
                              )}
                            </div>
                            {selectedPhoneNumberId === number.id && !isInUse && (
                              <CheckCircleIcon className="w-5 h-5 text-orange-500" />
                            )}
                            {isInUse && (
                              <div className="text-red-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhum número WhatsApp encontrado para esta conta
                  </p>
                )}
              </div>
            )}
            
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
                    <span className="font-medium">{formatPhoneNumber(selectedPhoneNumber)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de conexão:</span>
                    <span className="font-medium">{embeddedAccessToken ? 'Embedded Signup' : 'OAuth'}</span>
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
          disabled={isConnecting || isCreatingChannel}
        >
          Voltar
        </button>
      </div>
    </div>
  )
}