import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCompanies } from '@/hooks/use-companies'

export default function SuccessPage() {
  const navigate = useNavigate()
  const { companyId } = useParams<{ companyId: string }>()
  
  // Buscar nome da empresa
  const { companies } = useCompanies()
  const companyName = companies.find(c => c.id === companyId)?.name || ''

  const handleCreateChannel = () => {
    navigate(`/dashboard/company/${companyId}/channels/create`)
  }

  const handleGoToAgents = () => {
    navigate(`/dashboard/company/${companyId}/agents`)
  }

  return (
    <div className="flex px-4 pt-20 pb-8">
      <div className="max-w-6xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Conteúdo - Lado esquerdo */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Título de parabéns */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Parabéns! Seu agente foi criado com sucesso!
            </h1>

            {/* Texto explicativo */}
            <p className="text-lg text-gray-600 mb-8">
              Falta pouco! Só falta conectar o canal (WhatsApp) ao agente para ele começar a atender os seus clientes.
            </p>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={handleCreateChannel}
                className="px-6 py-3 text-white font-medium"
                style={{ 
                  background: 'linear-gradient(90deg, #F6921E, #EE413D)'
                }}
              >
                Conectar Canal WhatsApp
              </Button>
              
              <Button
                onClick={handleGoToAgents}
                variant="outline"
                className="px-6 py-3"
              >
                Ver Meus Agentes
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