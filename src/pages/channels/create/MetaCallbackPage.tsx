import { useChannelCreationForm } from '@/hooks/use-channel-creation-form'
import { useToast } from '@/hooks/use-toast'
import { channelsService } from '@/services/channels'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'

export default function MetaCallbackPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const { companyId: urlCompanyId } = useParams<{ companyId: string }>()
  const { updateFormData, companyId: savedCompanyId } = useChannelCreationForm()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Restaurar o token e usuário IMEDIATAMENTE antes de qualquer renderização
  const savedToken = sessionStorage.getItem('ialogus:oauth:token')
  const savedUser = sessionStorage.getItem('ialogus:oauth:user')
  
  if (savedToken && !localStorage.getItem('ialogus:token')) {
    console.log('🔐 Restaurando token do OAuth...')
    localStorage.setItem('ialogus:token', savedToken)
    sessionStorage.removeItem('ialogus:oauth:token')
  }
  
  if (savedUser && !localStorage.getItem('ialogus:user')) {
    console.log('👤 Restaurando usuário do OAuth...')
    localStorage.setItem('ialogus:user', savedUser)
    sessionStorage.removeItem('ialogus:oauth:user')
  }

  useEffect(() => {
    const processCallback = async () => {
      console.log('🔄 MetaCallbackPage - Estado inicial:', {
        urlCompanyId,
        savedCompanyId,
        searchParams: Object.fromEntries(searchParams.entries())
      })
      
      // Tentar decodificar o state do META para obter o companyId
      let companyIdFromState: string | undefined = urlCompanyId || savedCompanyId
      const oauthState = searchParams.get('state')
      
      if (oauthState) {
        try {
          const stateDecoded = JSON.parse(atob(oauthState))
          console.log('📦 Estado decodificado do META state:', stateDecoded)
          if (stateDecoded.companyId) {
            companyIdFromState = stateDecoded.companyId
            console.log('🏢 CompanyId recuperado do state do META:', companyIdFromState)
          }
        } catch (e) {
          console.error('Erro ao decodificar state do META:', e)
        }
      }
      
      // Tentar recuperar do app_state como fallback
      const appState = searchParams.get('app_state')
      
      if (appState) {
        try {
          const decoded = JSON.parse(atob(appState))
          console.log('📦 Estado decodificado do app_state (fallback):', decoded)
          
          if (!localStorage.getItem('ialogus:token') && decoded.token) {
            console.log('🔐 Restaurando token do app_state (fallback)...')
            localStorage.setItem('ialogus:token', decoded.token)
          }
          if (!localStorage.getItem('ialogus:user') && decoded.user) {
            console.log('👤 Restaurando usuário do app_state (fallback)...')
            localStorage.setItem('ialogus:user', decoded.user)
          }
          if (!companyIdFromState && decoded.companyId) {
            companyIdFromState = decoded.companyId
            console.log('🏢 CompanyId recuperado do app_state (fallback):', companyIdFromState)
          }
        } catch (e) {
          console.error('Erro ao decodificar app_state:', e)
        }
      }
      
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Se houver erro do Meta
      if (error) {
        setError(errorDescription || 'Erro ao autorizar com o Meta')
        setIsProcessing(false)
        
        toast({
          title: "Erro na autorização",
          description: errorDescription || error,
          variant: "destructive"
        })
        
        // Aguardar um momento e redirecionar de volta
        setTimeout(() => {
          const redirectUrl = companyIdFromState 
            ? `/dashboard/company/${companyIdFromState}/channels/create/meta-connection`
            : '/dashboard/channels/create/meta-connection'
          navigate(redirectUrl)
        }, 3000)
        return
      }

      // Se não houver código
      if (!code) {
        setError('Código de autorização não encontrado')
        setIsProcessing(false)
        
        toast({
          title: "Erro na autorização",
          description: "Código de autorização não encontrado",
          variant: "destructive"
        })
        
        setTimeout(() => {
          const redirectUrl = companyIdFromState 
            ? `/dashboard/company/${companyIdFromState}/channels/create/meta-connection`
            : '/dashboard/channels/create/meta-connection'
          navigate(redirectUrl)
        }, 3000)
        return
      }

      // O código já foi processado pelo backend público
      // Apenas marcar como autorizado e redirecionar
      updateFormData({
        authCode: code,
        businessAccounts: [], // Será carregado depois
        metaAuthData: {
          accessToken: 'authorized', // O token real fica no backend
        },
        companyId: companyIdFromState,
        step: 2
      })
      
      // Verificar se houve algum aviso
      const warning = searchParams.get('warning')
      if (warning) {
        toast({
          title: "Autorização parcial",
          description: "A conexão foi estabelecida, mas não foi possível acessar as contas de negócios. Verifique as permissões da aplicação no Meta.",
          variant: "warning"
        })
      } else {
        toast({
          title: "Autorização concluída!",
          description: "Conexão com Meta Business estabelecida com sucesso.",
        })
      }
      
      // Aguardar um momento para o usuário ver a mensagem
      setTimeout(() => {
        const redirectUrl = companyIdFromState 
          ? `/dashboard/company/${companyIdFromState}/channels/create/meta-connection`
          : '/dashboard/channels/create/meta-connection'
        navigate(redirectUrl)
      }, 1500)
    }

    processCallback()
  }, [searchParams, updateFormData, navigate, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          {isProcessing ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Processando autorização...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Estamos finalizando a conexão com o Meta Business. Aguarde um momento.
              </p>
            </>
          ) : error ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Erro na autorização
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              <p className="mt-4 text-xs text-gray-500">
                Você será redirecionado em instantes...
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}