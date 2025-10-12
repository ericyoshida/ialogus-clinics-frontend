import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services/channels'
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState } from 'react'

// Configurações do Meta conforme fornecidas
const META_APP_ID = '249811214391254'
const META_CONFIG_ID = '1898175917407594'
const META_SDK_VERSION = 'v23.0'

interface EmbeddedSignupProps {
  clinicId: string
  onSuccess: (data: {
    accessToken: string
    wabaId: string
    phoneNumberId: string
    phoneNumber: string
  }) => void
  onError?: (error: any) => void
}

interface SessionInfoData {
  accessToken: string
  wabaId: string
  phoneNumbers: Array<{
    id: string
    displayPhoneNumber: string
    verifiedName: string
    qualityRating: string
  }>
}

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

export function EmbeddedSignup({ clinicId, onSuccess, onError }: EmbeddedSignupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  // Carregar o SDK do Facebook
  useEffect(() => {
    // Se já existe o SDK, não recarregar
    if (window.FB) {
      setSdkLoaded(true)
      return
    }

    // Configurar callback de inicialização
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: META_SDK_VERSION
      })
      setSdkLoaded(true)
      console.log('✅ Facebook SDK carregado e inicializado')
    }

    // Carregar o script do SDK
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.src = `https://connect.facebook.net/pt_BR/sdk.js`
    
    document.body.appendChild(script)

    return () => {
      // Cleanup se necessário
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
        phoneNumber: selectedPhone.displayPhoneNumber
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
    console.log('🚀 Iniciando Embedded Signup com config:', META_CONFIG_ID)

    try {
      // Abrir o diálogo de Embedded Signup
      // IMPORTANTE: O callback NÃO pode ser async
      window.FB.login(
        (response: any) => {
          console.log('📝 Resposta do login:', response)
          
          if (response.authResponse) {
            const { code } = response.authResponse
            
            if (code) {
              console.log('✅ Código de autorização recebido')
              
              // Processar o código de forma assíncrona
              channelsService.exchangeEmbeddedSignupCode({
                code,
                clinicId
              })
              .then((result) => {
                // Processar a resposta
                handleSessionInfoReceived({
                  accessToken: result.accessToken,
                  wabaId: result.wabaId,
                  phoneNumbers: result.phoneNumbers
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
            } else {
              console.warn('⚠️ Nenhum código recebido na resposta')
              toast({
                title: 'Autenticação incompleta',
                description: 'Não foi possível obter o código de autorização.',
                variant: 'destructive'
              })
              setIsLoading(false)
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
              A coexistência permite conectar múltiplas contas WhatsApp Business simultaneamente.
              Cada conta usa sua própria autenticação isolada e segura.
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