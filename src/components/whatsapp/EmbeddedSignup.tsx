import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services/channels'
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useState } from 'react'

interface EmbeddedSignupProps {
  clinicId: string
  onSuccess: (data: EmbeddedSignupResult) => void
  onError: (error: string) => void
}

interface EmbeddedSignupResult {
  accessToken: string
  userID: string
  expiresIn: number
  whatsappBusinessAccounts: Array<{
    id: string
    name: string
    category: string
  }>
}

// Meta SDK Configuration
const META_CONFIG = {
  appId: '1141048344552370',
  configId: '1152173283136317',
  version: 'v24.0'
}

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

declare global {
  interface Window {
    FB: {
      init: (config: any) => void
      login: (callback: (response: any) => void, config?: any) => void
      getLoginStatus: (callback: (response: any) => void) => void
      AppEvents: {
        logEvent: (event: string, params?: any) => void
        logPageView: () => void
      }
    }
    fbAsyncInit: () => void
  }
}

export const EmbeddedSignup: React.FC<EmbeddedSignupProps> = ({
  clinicId,
  onSuccess,
  onError
}) => {
  const { toast } = useToast()
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sdkError, setSDKError] = useState<string | null>(null)

  // Status callback para verificar login do Facebook
  const statusChangeCallback = React.useCallback((response: any) => {
    console.log('📊 Status de login do Facebook:', response)

    if (response.status === 'connected') {
      console.log('✅ Usuário já está conectado ao Facebook')
    } else if (response.status === 'not_authorized') {
      console.log('⚠️ Usuário está logado no Facebook mas não autorizou o app')
    } else {
      console.log('ℹ️ Usuário não está logado no Facebook')
    }
  }, [])

  // Listener robusto para postMessage do Meta Embedded Signup
  useEffect(() => {
    const handlePostMessage = (event: MessageEvent) => {
      // Validar origem - aceitar subdomínios do Facebook
      try {
        const eventOrigin = new URL(event.origin).hostname
        if (!/\.facebook\.com$/.test(eventOrigin) && eventOrigin !== 'facebook.com') {
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
            console.log('✅ Processando via postMessage (FLUXO IDEAL)')
            // Processar dados diretamente via postMessage
            const phoneNumber = msg.data?.phone_number || ''
            onSuccess({
              accessToken: '', // Será obtido pelo backend
              userID: '',
              expiresIn: 0,
              whatsappBusinessAccounts: [{
                id: waba_id,
                name: msg.data?.business_name || 'WhatsApp Business',
                category: ''
              }]
            })
          } else {
            console.warn('⚠️ WA_EMBEDDED_SIGNUP FINISH recebido mas sem waba_id ou phone_number_id')
          }
        } else {
          console.log('📨 WA_EMBEDDED_SIGNUP evento:', msg.event)
        }
      }
    }

    console.log('👂 Listener de postMessage ativado - aguardando WA_EMBEDDED_SIGNUP')
    window.addEventListener('message', handlePostMessage)

    return () => {
      console.log('👂 Listener de postMessage removido')
      window.removeEventListener('message', handlePostMessage)
    }
  }, [onSuccess])

  useEffect(() => {
    // Se já existe o SDK, não recarregar
    if (window.FB) {
      setIsSDKLoaded(true)
      return
    }

    // Padrão oficial do Facebook SDK (IIFE)
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: META_CONFIG.appId,
        autoLogAppEvents: true,
        cookie: true,
        xfbml: true,
        version: META_CONFIG.version
      })

      // Log page view conforme recomendado pelo Facebook
      if (window.FB.AppEvents) {
        window.FB.AppEvents.logPageView()
      }

      setIsSDKLoaded(true)
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
      js = d.createElement(s) as HTMLScriptElement
      js.id = id
      js.src = "https://connect.facebook.net/en_US/sdk.js"
      js.async = true
      js.defer = true
      js.crossOrigin = 'anonymous'
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs)
      }
    }(document, 'script', 'facebook-jssdk'))

    return () => {
      // Cleanup se necessário
    }
  }, [statusChangeCallback])

  const handleEmbeddedSignup = async () => {
    if (!isSDKLoaded || !window.FB) {
      setSDKError('Meta SDK is not loaded. Please refresh the page and try again.')
      return
    }

    setIsLoading(true)
    setSDKError(null)

    try {
      console.log('🚀 Iniciando Embedded Signup com configuração:', {
        appId: META_CONFIG.appId,
        configId: META_CONFIG.configId,
        version: META_CONFIG.version,
        isHttps: window.location.protocol === 'https:',
        hostname: window.location.hostname
      })

      // Use Facebook Login with WhatsApp Business permissions
      window.FB.login((response) => {
        console.log('📝 Resposta completa do login:', response)
        console.log('📋 AuthResponse detalhado:', response.authResponse)

        if (response.authResponse) {
          const { code, accessToken, userID } = response.authResponse

          console.log('🔍 Verificando tipo de resposta:', {
            hasCode: !!code,
            hasAccessToken: !!accessToken,
            hasUserID: !!userID
          })

          if (code || accessToken) {
            if (code) {
              console.log('✅ FLUXO OAUTH: Código de autorização recebido')
              console.log('⚠️ NOTA: Se você esperava receber waba_id via postMessage, verifique:')
              console.log('   1. O app tem "WhatsApp Embedded Signup" habilitado nas configurações')
              console.log('   2. Não está ocorrendo redirect completo de página')
              console.log('   3. Está em HTTPS (ou localhost)')
              console.log('   4. O config_id está correto:', META_CONFIG.configId)
            }
            handleAuthResponse(response.authResponse)
          } else {
            console.warn('⚠️ Nenhum código ou token recebido na resposta')
            console.warn('💡 DICA: O postMessage pode estar chegando separadamente. Aguarde...')
            // Não fechar o loading ainda - pode ser que o postMessage chegue
            setTimeout(() => {
              setIsLoading(false)
              onError('No authorization code or token received')
            }, 3000)
          }
        } else {
          console.error('❌ User cancelled login or did not fully authorize.')
          onError('Authentication was cancelled or failed')
          setIsLoading(false)
        }
      }, {
        config_id: META_CONFIG.configId,
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
      })
    } catch (error) {
      console.error('❌ Error during embedded signup:', error)
      onError('Failed to start embedded signup process')
      setIsLoading(false)
    }
  }

  const handleAuthResponse = async (authResponse: any) => {
    try {
      console.log('🔑 Processing auth response:', authResponse)
      
      // Extract the access token and user info
      const { accessToken, userID, expiresIn, code } = authResponse
      
      if (code) {
        // Handle the authorization code flow
        console.log('📝 Processing authorization code...')
        
        // Send the code to our backend for token exchange
        const result = await channelsService.exchangeEmbeddedSignupCode({
          code,
          clinicId,
          configId: META_CONFIG.configId
        })
        
        if (result.success) {
          toast({
            title: "WhatsApp Business Connected!",
            description: "Successfully connected your WhatsApp Business account.",
          })
          
          onSuccess({
            accessToken: result.accessToken,
            userID: result.userID,
            expiresIn: result.expiresIn,
            whatsappBusinessAccounts: result.whatsappBusinessAccounts || []
          })
        } else {
          throw new Error(result.error || 'Failed to exchange authorization code')
        }
      } else if (accessToken) {
        // Direct access token flow (fallback)
        console.log('🎫 Processing access token...')
        
        // Log the successful signup event
        if (window.FB.AppEvents) {
          window.FB.AppEvents.logEvent('WhatsAppBusinessSignup', {
            clinicId,
            configId: META_CONFIG.configId
          })
        }
        
        // Fetch WhatsApp Business Accounts
        const businessAccounts = await fetchWhatsAppBusinessAccounts(accessToken)
        
        toast({
          title: "WhatsApp Business Connected!",
          description: "Successfully connected your WhatsApp Business account.",
        })
        
        onSuccess({
          accessToken,
          userID,
          expiresIn,
          whatsappBusinessAccounts: businessAccounts
        })
      } else {
        throw new Error('No access token or authorization code received')
      }
    } catch (error) {
      console.error('❌ Error processing auth response:', error)
      onError(error instanceof Error ? error.message : 'Failed to process authentication response')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWhatsAppBusinessAccounts = async (accessToken: string) => {
    try {
      // Use the Graph API to fetch WhatsApp Business Accounts
      const response = await fetch(`https://graph.facebook.com/${META_CONFIG.version}/me/businesses?access_token=${accessToken}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch business accounts')
      }
      
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('❌ Error fetching business accounts:', error)
      return []
    }
  }

  if (sdkError) {
    return (
      <Alert className="mb-6 border-red-200 bg-red-50">
        <InformationCircleIcon className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          <strong>SDK Error:</strong> {sdkError}
          <br />
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm underline hover:no-underline"
          >
            Refresh page to retry
          </button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Alert className="mb-6">
        <InformationCircleIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Embedded WhatsApp Business Signup</strong><br />
          Connect your WhatsApp Business account directly without leaving this page. 
          This method allows you to manage multiple business accounts efficiently.
        </AlertDescription>
      </Alert>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Benefits of Embedded Signup</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Seamless integration without page redirects</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Support for multiple WhatsApp Business accounts</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Enhanced security with limited scope permissions</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Real-time account verification and setup</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleEmbeddedSignup}
          disabled={!isSDKLoaded || isLoading}
          className="bg-[#1877F2] hover:bg-[#1864D9] text-white px-8 py-3 text-base"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </>
          ) : !isSDKLoaded ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading SDK...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Connect WhatsApp Business
            </>
          )}
        </Button>
      </div>

      {!isSDKLoaded && !sdkError && (
        <div className="text-center text-sm text-gray-500">
          Loading Meta SDK... This may take a few moments.
        </div>
      )}
    </div>
  )
}