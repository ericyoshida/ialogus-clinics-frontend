import { MultiStepChannel } from '@/components/multi-step-channel'
import { Button } from '@/components/ui/button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { EmbeddedSignup } from '@/components/channels/EmbeddedSignup'
import { useChannelCreationForm } from '@/hooks/use-channel-creation-form'
import { useClinics } from '@/hooks/use-clinics'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services/channels'
import { formatPhoneNumber, sanitizePhoneNumber } from '@/utils/phone'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
    userWabaConnectionId,
    updateFormData,
    clearFormData
  } = useChannelCreationForm()
  
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false)
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [numbersAvailability, setNumbersAvailability] = useState<Record<string, { inUse: boolean; channelName?: string }>>({})

  // Estados para seleção
  const [localChannelName, setLocalChannelName] = useState(channelName || '')
  const [embeddedAccessToken, setEmbeddedAccessToken] = useState<string | null>(null)
  const [localWabaConnectionId, setLocalWabaConnectionId] = useState<string | undefined>(undefined)

  // Estados para conexões existentes
  const [existingConnections, setExistingConnections] = useState<any[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [selectedExistingConnectionId, setSelectedExistingConnectionId] = useState<string | null>(null)
  const [showExistingTab, setShowExistingTab] = useState(true) // true = mostrar existentes, false = criar nova

  // Salvar clinicId no estado quando montar o componente
  useEffect(() => {
    if (clinicId && clinicId !== savedClinicId) {
      updateFormData({ clinicId })
    }
  }, [clinicId, savedClinicId, updateFormData])

  // DEBUG: Monitor userWabaConnectionId changes
  useEffect(() => {
    console.log('🔄 [DEBUG] userWabaConnectionId changed in Zustand store:', userWabaConnectionId || 'undefined')
  }, [userWabaConnectionId])

  // Buscar conexões WABA existentes ao montar componente
  useEffect(() => {
    const loadExistingConnections = async () => {
      try {
        const connections = await channelsService.getUserWabaConnections()
        setExistingConnections(connections)

        // Se tiver conexões, mostrar tab de existentes por padrão
        if (connections.length > 0) {
          setShowExistingTab(true)
        } else {
          // Se não tiver conexões, ir direto para criar nova
          setShowExistingTab(false)
        }
      } catch (error) {
        console.error('Erro ao carregar conexões existentes:', error)
        // Em caso de erro, mostrar opção de criar nova
        setShowExistingTab(false)
      } finally {
        setIsLoadingConnections(false)
      }
    }

    loadExistingConnections()
  }, [])

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
      // SKIP if using Embedded Signup - phone numbers already provided in callback
      if (!selectedBusinessAccountId || !isAuthenticated || embeddedAccessToken) return

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
  }, [selectedBusinessAccountId, isAuthenticated, embeddedAccessToken, updateFormData, toast])

  const handleEmbeddedSignupSuccess = async (signupData: any) => {
    console.log('🎉 Embedded signup successful:', signupData)

    // Store the access token for channel creation
    setEmbeddedAccessToken(signupData.accessToken)

    // Store wabaConnectionId in local state to avoid Zustand persist race condition
    setLocalWabaConnectionId(signupData.wabaConnectionId)

    // Update form data with the business accounts and userWabaConnectionId
    updateFormData({
      metaAuthData: {
        accessToken: 'embedded_signup_token', // Placeholder
      },
      businessAccounts: signupData.wabaId ? [{
        id: signupData.wabaId,
        name: 'WhatsApp Business Account',
        verificationStatus: 'VERIFIED'
      }] : [],
      selectedBusinessAccountId: signupData.wabaId, // Auto-select the business account
      selectedPhoneNumberId: signupData.phoneNumberId, // Set phone number ID
      selectedPhoneNumber: signupData.phoneNumber, // Set phone number display
      userWabaConnectionId: signupData.wabaConnectionId // Store in Zustand store
    })

    if (signupData.wabaConnectionId) {
      console.log('📦 Stored userWabaConnectionId in Zustand store:', signupData.wabaConnectionId)
    } else {
      console.warn('⚠️ No wabaConnectionId received from backend!')
    }

    console.log('📱 Phone data set:', {
      phoneNumberId: signupData.phoneNumberId,
      phoneNumber: signupData.phoneNumber,
      businessAccountId: signupData.wabaId
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
    console.log('🚀 handleComplete called')
    console.log('📋 Current state from Zustand store:')
    console.log('  - userWabaConnectionId:', userWabaConnectionId || 'undefined')
    console.log('  - selectedBusinessAccountId:', selectedBusinessAccountId)
    console.log('  - selectedPhoneNumberId:', selectedPhoneNumberId)

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
      
      // DEBUG: Check Zustand store value
      console.log('🔍 [DEBUG] Before creating channelData:')
      console.log('  - localWabaConnectionId (state):', localWabaConnectionId)
      console.log('  - userWabaConnectionId from Zustand:', userWabaConnectionId)
      console.log('  - typeof:', typeof userWabaConnectionId)

      const channelData = {
        phoneNumber: sanitizedPhoneNumber,
        agentsIds: selectedAgentIds, // Fixed: backend expects "agentsIds" not "botModelsIds"
        additionalInstructions: '',
        operationalRegion: 'BR',
        whatsappPhoneNumberId: selectedPhoneNumberId,
        whatsappBusinessAccountId: selectedBusinessAccountId,
        metaBusinessAccountId: selectedBusinessAccountId,
        botName: localChannelName,
        waitTimeoutToEndChatLog: 300, // 5 minutos padrão
        embeddedAccessToken: embeddedAccessToken || undefined, // DEPRECATED
        userWabaConnectionId: localWabaConnectionId || userWabaConnectionId || undefined // Prioritize local state over Zustand
      }

      console.log('🔍 [DEBUG] After creating channelData:')
      console.log('  - channelData.userWabaConnectionId:', channelData.userWabaConnectionId)

      console.log('📦 Creating channel with data:')
      console.log('  - phoneNumber:', sanitizedPhoneNumber)
      console.log('  - agentsIds:', selectedAgentIds)
      console.log('  - whatsappPhoneNumberId:', selectedPhoneNumberId)
      console.log('  - whatsappBusinessAccountId:', selectedBusinessAccountId)
      console.log('  - userWabaConnectionId:', userWabaConnectionId || 'undefined')
      console.log('  - embeddedAccessToken:', embeddedAccessToken ? 'presente' : 'ausente')

      // Sempre usar o fluxo Embedded Signup
      await channelsService.createWhatsAppChannelEmbedded(clinicId, channelData)
      
      toast({
        title: "Canal criado com sucesso!",
        description: "Seu canal WhatsApp foi configurado e está pronto para uso.",
      })

      // Limpar estados locais
      setLocalWabaConnectionId(undefined)
      setEmbeddedAccessToken(null)

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
        </div>
        
        <p className="text-sm text-gray-500 mb-1">
          Etapa 3: Conecte sua conta do Meta Business e configure o WhatsApp (Embedded Signup)
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full mt-8 space-y-6">
        {!isAuthenticated ? (
          // Embedded Signup Flow
          <EmbeddedSignup
            clinicId={clinicId || savedClinicId || ''}
            onSuccess={handleEmbeddedSignupSuccess}
            onError={handleEmbeddedSignupError}
          />
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
                      userWabaConnectionId: undefined,
                    })
                    setEmbeddedAccessToken(null)
                    setLocalWabaConnectionId(undefined)
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
                    <span className="font-medium">Embedded Signup</span>
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
