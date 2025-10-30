import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services/channels'
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState, useRef } from 'react'

// Configurações do Meta conforme fornecidas
const META_APP_ID = '1141048344552370'
const META_CONFIG_ID = '1152173283136317'
const META_SDK_VERSION = 'v24.0'

/**
 * Meta WhatsApp Embedded Signup - Dois Fluxos Possíveis:
 *
 * 1. FLUXO IDEAL - postMessage (iframe embedded):
 *    - O usuário completa o fluxo dentro de um iframe/popup controlado
 *    - Meta envia evento `WA_EMBEDDED_SIGNUP` via postMessage
 *    - Recebemos `waba_id` e `phone_number_id` diretamente
 *    - Requisitos: HTTPS, configuração correta do app, sem redirect de página
 *
 * 2. FLUXO FALLBACK - OAuth code flow (redirect):
 *    - Ocorre quando há redirect de página completa
 *    - Meta retorna apenas `authResponse.code`
 *    - Precisamos trocar o código por access token via backend
 *    - Usado quando: HTTP, Safari com cookies bloqueados, configuração incompleta
 *
 * Este componente implementa AMBOS os fluxos para máxima compatibilidade.
 */

interface EmbeddedSignupProps {
  clinicId: string
  onSuccess: (data: {
    accessToken: string
    wabaId: string
    phoneNumberId: string
    phoneNumber: string
    wabaConnectionId?: string // NEW: for channel creation
  }) => void
  onError?: (error: any) => void
}

interface SessionInfoData {
  accessToken: string
  wabaId: string
  wabaConnectionId?: string // NEW: from exchange response
  phoneNumbers: Array<{
    id: string
    displayPhoneNumber: string
    verifiedName: string
    qualityRating: string
  }>
}

declare global {
  interface Window {
    FB: {
      init: (config: any) => void
      login: (callback: (response: any) => void, config?: any) => void
      getLoginStatus: (callback: (response: any) => void, force?: boolean) => void
      AppEvents?: {
        logPageView: () => void
      }
    }
    fbAsyncInit: () => void
  }
}

export function EmbeddedSignup({ clinicId, onSuccess, onError }: EmbeddedSignupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  // NEW: Store postMessage data to use in exchange (using useRef to avoid race condition)
  const postMessageWabaIdRef = useRef<string | null>(null)
  const postMessagePhoneNumberIdRef = useRef<string | null>(null)
  const { toast } = useToast()

  // Função para processar mudanças no status de login
  const statusChangeCallback = useCallback((response: any) => {
    console.log('📋 Status Change Callback:', response)

    if (response.status === 'connected') {
      // Usuário está logado no Facebook e autorizou o app
      console.log('✅ Usuário já conectado:', {
        status: response.status,
        userID: response.authResponse?.userID,
        accessToken: response.authResponse?.accessToken?.substring(0, 20) + '...'
      })

      // Nota: Para Embedded Signup, ainda precisamos do fluxo completo
      // porque precisamos do código de autorização para o WhatsApp Business
      // O login status apenas confirma que o usuário está logado no Facebook

    } else if (response.status === 'not_authorized') {
      // Usuário está logado no Facebook mas não autorizou o app
      console.log('⚠️ Usuário logado no Facebook mas não autorizou o app')

    } else {
      // Usuário não está logado no Facebook
      console.log('ℹ️ Usuário não está logado no Facebook')
    }
  }, [])

  // Função para processar a resposta do Embedded Signup
  const handleSessionInfoReceived = useCallback(async (sessionInfo: SessionInfoData) => {
    console.log('📦 Session info recebida:', sessionInfo)

    try {
      // Verificar se tem números de telefone disponíveis
      if (!sessionInfo.phoneNumbers || sessionInfo.phoneNumbers.length === 0) {
        throw new Error('Nenhum número WhatsApp encontrado na conta')
      }

      // Por enquanto, usar o primeiro número disponível
      // Em uma implementação mais completa, permitir que o usuário escolha
      const selectedPhone = sessionInfo.phoneNumbers[0]

      setIsConnected(true)

      // Chamar callback de sucesso com os dados
      onSuccess({
        accessToken: sessionInfo.accessToken,
        wabaId: sessionInfo.wabaId,
        phoneNumberId: selectedPhone.id,
        phoneNumber: selectedPhone.displayPhoneNumber,
        wabaConnectionId: sessionInfo.wabaConnectionId // NEW: pass to parent
      })

      toast({
        title: 'Conexão estabelecida!',
        description: `WhatsApp ${selectedPhone.displayPhoneNumber} conectado com sucesso.`,
      })
    } catch (error: any) {
      console.error('❌ Erro ao processar session info:', error)
      toast({
        title: 'Erro ao processar conexão',
        description: error.message || 'Erro ao processar os dados da conexão.',
        variant: 'destructive'
      })
      onError?.(error)
    }
  }, [onSuccess, onError, toast])

  // Função para processar dados recebidos via postMessage
  const handleEmbeddedSignupViaPostMessage = useCallback(async (
    wabaId: string,
    phoneNumberId: string,
    additionalData: any
  ) => {
    console.log('📦 Processing Embedded Signup via postMessage...')
    console.log('📋 Additional data received:', additionalData)
    setIsLoading(true)

    try {
      // Extrair o phone number do additionalData se disponível
      const phoneNumber = additionalData?.phone_number || ''

      // Criar dados de sessão para processar
      const sessionData: SessionInfoData = {
        accessToken: '', // Será obtido pelo backend quando criar o canal
        wabaId: wabaId,
        phoneNumbers: [{
          id: phoneNumberId,
          displayPhoneNumber: phoneNumber,
          verifiedName: additionalData?.business_name || '',
          qualityRating: 'UNKNOWN'
        }]
      }

      // Processar via fluxo padrão
      await handleSessionInfoReceived(sessionData)
    } catch (error: any) {
      console.error('❌ Error processing postMessage data:', error)
      toast({
        title: 'Erro ao processar conexão',
        description: error.message || 'Não foi possível processar os dados recebidos.',
        variant: 'destructive'
      })
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [handleSessionInfoReceived, toast, onError])

  // Listener robusto para postMessage do Meta Embedded Signup
  useEffect(() => {
    const handlePostMessage = (event: MessageEvent) => {
      // Validar origem - aceitar subdomínios do Facebook
      try {
        const eventOrigin = new URL(event.origin).hostname
        if (!/\.facebook\.com$/.test(eventOrigin) && eventOrigin !== 'facebook.com') {
          // Origem não é do Facebook - ignorar silenciosamente
          return
        }
      } catch {
        return
      }

      // Log de debug: todas as mensagens do Facebook
      console.log('📨 PostMessage recebida do Facebook:', {
        origin: event.origin,
        dataType: typeof event.data,
        rawData: event.data
      })

      // Processar mensagem - pode vir como string ou objeto
      let msg = event.data
      if (typeof msg === 'string') {
        try {
          msg = JSON.parse(msg)
        } catch {
          console.log('📨 Mensagem não é JSON válido, ignorando')
          return
        }
      }

      // Log de todas as mensagens estruturadas
      if (msg?.type) {
        console.log('📨 Mensagem estruturada recebida:', {
          type: msg.type,
          event: msg.event,
          data: msg.data
        })
      }

      // Verificar se é o evento de finalização do Embedded Signup
      if (msg?.type === 'WA_EMBEDDED_SIGNUP') {
        if (msg?.event === 'FINISH') {
          const { waba_id, phone_number_id } = msg.data || {}

          console.log('🎉 ✅ FLUXO POSTMESSAGE: Recebido WA_EMBEDDED_SIGNUP FINISH:', {
            waba_id,
            phone_number_id,
            fullData: msg.data
          })

          if (waba_id && phone_number_id) {
            // NEW: Store IDs for use in exchange (using ref for immediate availability)
            console.log('✅ Armazenando IDs do postMessage para usar no exchange')
            postMessageWabaIdRef.current = waba_id
            postMessagePhoneNumberIdRef.current = phone_number_id

            // OLD BEHAVIOR: Process via postMessage directly (kept as fallback)
            // handleEmbeddedSignupViaPostMessage(waba_id, phone_number_id, msg.data)
          } else {
            console.warn('⚠️ WA_EMBEDDED_SIGNUP FINISH recebido mas sem waba_id ou phone_number_id')
          }
        } else {
          console.log('📨 WA_EMBEDDED_SIGNUP evento:', msg.event)
        }
      }
    }

    // Adicionar listener
    console.log('👂 Listener de postMessage ativado - aguardando WA_EMBEDDED_SIGNUP')
    window.addEventListener('message', handlePostMessage)

    return () => {
      console.log('👂 Listener de postMessage removido')
      window.removeEventListener('message', handlePostMessage)
    }
  }, [handleEmbeddedSignupViaPostMessage])

  // Carregar o SDK do Facebook usando o padrão oficial
  useEffect(() => {
    // Se já existe o SDK, não recarregar
    if (window.FB) {
      setSdkLoaded(true)
      return
    }

    // Padrão oficial do Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        cookie: true,
        xfbml: true,
        version: META_SDK_VERSION
      })

      // Log page view conforme recomendado pelo Facebook
      if (window.FB.AppEvents) {
        window.FB.AppEvents.logPageView()
      }

      setSdkLoaded(true)
      console.log('✅ Facebook SDK carregado e inicializado')

      // Verificar status de login conforme documentação oficial
      window.FB.getLoginStatus(function(response) {
        console.log('📊 Login Status:', response)
        statusChangeCallback(response)
      })
    }

    // IIFE pattern oficial do Facebook para carregar o SDK
    ;(function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0]
      if (d.getElementById(id)) { return }
      js = d.createElement(s)
      js.id = id
      js.src = "https://connect.facebook.net/en_US/sdk.js"
      ;(js as HTMLScriptElement).async = true
      ;(js as HTMLScriptElement).defer = true
      ;(js as HTMLScriptElement).crossOrigin = 'anonymous'
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs)
      }
    }(document, 'script', 'facebook-jssdk'))

    return () => {
      // Cleanup se necessário
    }
  }, [statusChangeCallback])

  // Função para iniciar o fluxo de Embedded Signup
  const handleStartEmbeddedSignup = useCallback(() => {
    // Verificar se estamos em HTTPS
    if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
      toast({
        title: 'HTTPS Necessário',
        description: 'O Embedded Signup requer conexão segura (HTTPS). Por favor, acesse via HTTPS.',
        variant: 'destructive'
      })
      return
    }

    if (!sdkLoaded || !window.FB) {
      toast({
        title: 'SDK não carregado',
        description: 'Aguarde o carregamento do SDK do Facebook.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    console.log('🚀 Iniciando Embedded Signup com configuração:', {
      appId: META_APP_ID,
      configId: META_CONFIG_ID,
      version: META_SDK_VERSION,
      isHttps: window.location.protocol === 'https:',
      hostname: window.location.hostname
    })

    try {
      // Abrir o diálogo de Embedded Signup
      // IMPORTANTE: O callback NÃO pode ser async
      window.FB.login(
        (response: any) => {
          console.log('📝 Resposta completa do login:', response)
          console.log('📋 AuthResponse detalhado:', response.authResponse)

          if (response.authResponse) {
            const { code, accessToken, userID } = response.authResponse

            console.log('🔍 Verificando tipo de resposta:', {
              hasCode: !!code,
              hasAccessToken: !!accessToken,
              hasUserID: !!userID
            })

            if (code) {
              console.log('✅ FLUXO OAUTH: Código de autorização recebido')
              console.log('📋 Verificando se temos dados do postMessage:', {
                wabaId: postMessageWabaIdRef.current,
                phoneNumberId: postMessagePhoneNumberIdRef.current
              })

              // NEW: Include postMessage data in exchange if available
              channelsService.exchangeEmbeddedSignupCode({
                code,
                clinicId,
                wabaId: postMessageWabaIdRef.current || undefined,
                phoneNumberId: postMessagePhoneNumberIdRef.current || undefined
              })
              .then((result) => {
                console.log('✅ Código trocado com sucesso via backend')
                console.log('📦 wabaConnectionId recebido:', result.wabaConnectionId)
                // Processar a resposta
                handleSessionInfoReceived({
                  accessToken: result.accessToken,
                  wabaId: result.wabaId,
                  phoneNumbers: result.phoneNumbers,
                  wabaConnectionId: result.wabaConnectionId // NEW: pass to handler
                })
                setIsLoading(false)
              })
              .catch((error: any) => {
                console.error('❌ Erro ao trocar código:', error)
                toast({
                  title: 'Erro na autenticação',
                  description: error.response?.data?.message || 'Erro ao processar autenticação.',
                  variant: 'destructive'
                })
                onError?.(error)
                setIsLoading(false)
              })
            } else if (accessToken) {
              console.log('✅ FLUXO DIRETO: Access token recebido')
              // Se recebemos accessToken diretamente (menos comum)
              handleSessionInfoReceived({
                accessToken: accessToken,
                wabaId: '', // Será obtido do backend
                phoneNumbers: []
              })
              setIsLoading(false)
            } else {
              console.warn('⚠️ Nenhum código ou token recebido na resposta')
              console.warn('💡 DICA: O postMessage pode estar chegando separadamente. Aguarde...')
              // Não fechar o loading ainda - pode ser que o postMessage chegue
              setTimeout(() => {
                setIsLoading(false)
                toast({
                  title: 'Autenticação incompleta',
                  description: 'Não foi possível obter os dados de autorização.',
                  variant: 'destructive'
                })
              }, 3000) // Aguardar 3 segundos para ver se postMessage chega
            }
          } else {
            console.log('❌ Usuário cancelou ou erro no login')
            toast({
              title: 'Conexão cancelada',
              description: 'A conexão com o WhatsApp Business foi cancelada.',
              variant: 'destructive'
            })
            setIsLoading(false)
          }
        },
        {
          config_id: META_CONFIG_ID,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {
              // Solicitar permissões do WhatsApp Business
              features: ['whatsapp_business_management', 'whatsapp_business_messaging']
            },
            // Versão do sessionInfo
            sessionInfoVersion: 3
          }
        }
      )
    } catch (error: any) {
      console.error('❌ Erro ao iniciar Embedded Signup:', error)
      setIsLoading(false)
      toast({
        title: 'Erro ao iniciar conexão',
        description: 'Não foi possível iniciar o processo de conexão.',
        variant: 'destructive'
      })
      onError?.(error)
    }
  }, [sdkLoaded, clinicId, handleSessionInfoReceived, toast, onError])

  // Verificar se estamos em HTTP (não HTTPS)
  const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost'

  return (
    <div className="space-y-6">
      {!isConnected ? (
        <>
          {!isHttps && (
            <Alert className="border-red-200 bg-red-50">
              <InformationCircleIcon className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Conexão HTTPS Necessária!</strong><br/>
                O Embedded Signup do Meta requer uma conexão segura (HTTPS). 
                Por favor, acesse a aplicação via HTTPS para usar esta funcionalidade.
                <br/><br/>
                Para desenvolvimento local, use: <code>https://localhost:5173</code>
              </AlertDescription>
            </Alert>
          )}
          
          <Alert>
            <InformationCircleIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Meta WhatsApp Embedded Signup</strong><br/>
              A coexistência permite conectar múltiplas contas WhatsApp Business simultaneamente.
              Cada conta usa sua própria autenticação isolada e segura.
              <br/><br/>
              <strong>Como funciona:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                <li>
                  <strong>Fluxo Ideal:</strong> Conexão via iframe/popup - você receberá os dados diretamente (requer HTTPS)
                </li>
                <li>
                  <strong>Fluxo Alternativo:</strong> Conexão via OAuth - processamento via backend (funciona em HTTP)
                </li>
              </ul>
              <p className="mt-2 text-xs text-gray-600">
                💡 Dica: Abra o Console do navegador (F12) para ver logs detalhados do processo de conexão
              </p>
            </AlertDescription>
          </Alert>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Benefícios da Coexistência</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  <strong>Múltiplas Contas:</strong> Conecte várias contas WhatsApp Business independentes
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  <strong>Isolamento:</strong> Cada conta funciona de forma totalmente isolada
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  <strong>Escalabilidade:</strong> Adicione novas contas conforme necessário
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  <strong>Segurança:</strong> Tokens individuais por conta, sem compartilhamento
                </span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleStartEmbeddedSignup}
              disabled={isLoading || !sdkLoaded}
              className="bg-[#1877F2] hover:bg-[#1864D9] text-white px-8 py-3 text-base"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Conectando...
                </>
              ) : !sdkLoaded ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Carregando SDK...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  Conectar WhatsApp Business
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-800">
              WhatsApp Business conectado com sucesso!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
