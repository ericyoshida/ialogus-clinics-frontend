import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCompanies } from '@/hooks/use-companies'

export default function ChannelSuccessPage() {
  const navigate = useNavigate()
  const { companyId } = useParams<{ companyId: string }>()
  
  // Buscar nome da empresa
  const { companies } = useCompanies()
  const companyName = companies.find(c => c.id === companyId)?.name || ''

  const handleGoToConversations = () => {
    navigate(`/dashboard/company/${companyId}/conversations`)
  }

  const handleGoToChannels = () => {
    navigate(`/dashboard/company/${companyId}/channels`)
  }

  return (
    <div className="flex px-4 pt-20 pb-8">
      <div className="max-w-6xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Conteúdo - Lado esquerdo */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Título de parabéns */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Parabéns! Seu canal foi conectado com sucesso!
            </h1>

            {/* Texto explicativo */}
            <p className="text-lg text-gray-600 mb-8">
              Tudo pronto! Agora seu agente já pode começar a atender seus clientes pelo WhatsApp. Acompanhe as conversas em tempo real.
            </p>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={handleGoToConversations}
                className="px-6 py-3 text-white font-medium"
                style={{ 
                  background: 'linear-gradient(90deg, #F6921E, #EE413D)'
                }}
              >
                Ver Conversas
              </Button>
              
              <Button
                onClick={handleGoToChannels}
                variant="outline"
                className="px-6 py-3"
              >
                Ver Meus Canais
              </Button>
            </div>

            {/* Informação adicional */}
            <p className="text-sm text-gray-500 mt-8">
              Você está gerenciando: <span className="font-medium">{companyName}</span>
            </p>
          </div>

          {/* Imagem de congratulações - Lado direito */}
          <div className="flex justify-center lg:justify-start order-1 lg:order-2">
            <img 
              src="/images/congratulations.svg" 
              alt="Parabéns" 
              className="w-full max-w-md h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  )
}