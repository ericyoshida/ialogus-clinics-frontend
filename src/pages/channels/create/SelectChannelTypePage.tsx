import { FeatureCard } from '@/components/ui/feature-card'
import { MultiStepChannel } from '@/components/multi-step-channel'
import { useChannelCreationForm } from '@/hooks/use-channel-creation-form'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useCompanies } from '@/hooks/use-companies'
import { useEffect, useState } from 'react'


const WhatsAppIcon = ({ className }: { className?: string }) => (
  <img 
    src="/images/icons/whatsapp.svg"
    alt="WhatsApp"
    className={cn("w-6 h-6", className)}
  />
)

function ChannelTypeCard({ 
  type, 
  selected, 
  onClick 
}: { 
  type: { 
    id: string
    title: string
    description: string
    imagePath: string
    gradientColors: { from: string; to: string }
  }
  selected: boolean
  onClick: () => void
}) {
  const customSvgStyle = {
    bottom: '-18px',
    right: '-5px',
  }
  
  return (
    <div className="w-[250px] h-[250px] relative my-4">
      {selected && (
        <div className="absolute -top-4 left-3 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white">
          Selecionado
        </div>
      )}
      <div className="w-full h-full">
        <FeatureCard
          title={type.title}
          description={type.description}
          icon={<WhatsAppIcon />}
          decorativeElement="svg"
          svgPath={type.imagePath}
          svgStyle={customSvgStyle}
          gradientColors={type.gradientColors}
          onClick={onClick}
          className={`h-full w-full aspect-square ${selected ? `ring-2 ring-offset-2 ring-[${type.gradientColors.from}]` : ''}`}
        />
      </div>
      {selected && (
        <div 
          className="absolute inset-0 z-5 rounded-lg pointer-events-none"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0) 20%, ${type.gradientColors.from} 100%)`,
            opacity: 0.25,
          }}
        />
      )}
    </div>
  )
}

export default function SelectChannelTypePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { companyId } = useParams<{ companyId: string }>()
  const { selectedChannelType, updateFormData, clearFormData } = useChannelCreationForm()
  const [lastCompanyId, setLastCompanyId] = useState(companyId)
  
  // Buscar nome da empresa
  const { companies } = useCompanies()
  const companyName = companies.find(c => c.id === companyId)?.name || 'Carregando...'
  
  // Limpar dados do formulário quando a empresa mudar
  useEffect(() => {
    if (companyId !== lastCompanyId) {
      console.log('Empresa mudou no fluxo de criação de canal, limpando dados do formulário')
      clearFormData()
      setLastCompanyId(companyId)
    }
  }, [companyId, lastCompanyId, clearFormData])
  
  const channelTypes = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Business',
      description: 'Configure um canal para conectar seu WhatsApp Business e automatizar conversas com seus clientes.',
      imagePath: '/images/whatsapp-image.svg',
      gradientColors: { from: '#25D366', to: '#128C7E' }
    }
  ]
  
  const handleChannelSelect = (type: 'whatsapp') => {
    updateFormData({ selectedChannelType: type, companyId, step: 0 })
  }
  
  const handleNext = () => {
    if (selectedChannelType) {
      navigate(`/dashboard/company/${companyId}/channels/create/agents`)
    }
  }
  
  const handleBack = () => {
    // Voltar para onde veio (da state.from ou fallback para dashboard com empresa)
    const from = location.state?.from || `/dashboard/company/${companyId}/channels`
    navigate(from)
  }
  
  const canProceed = selectedChannelType !== null
  
  return (
    <div className="max-w-7xl h-[calc(100vh-80px)] flex flex-col -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      <div className="flex flex-col mb-1">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Criar Novo Canal
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{companyName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Configure um novo canal de comunicação para seus agentes</p>
        
        <div className="w-full mb-6">
          <MultiStepChannel 
            currentStep={1} 
            className="max-w-full"
          />
        </div>
        
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-medium text-gray-800">Selecionar Canal de Comunicação</h2>
        </div>
        
        <p className="text-sm text-gray-500 mb-1">Etapa 1: Escolha o tipo de canal que deseja configurar</p>
      </div>

      <div className="mb-2">
        <div className="overflow-x-auto overflow-y-hidden py-4">
          <div className="flex gap-5 min-w-max px-1 py-4">
            {channelTypes.map((type) => (
              <ChannelTypeCard
                key={type.id}
                type={type}
                selected={selectedChannelType === type.id}
                onClick={() => handleChannelSelect(type.id as 'whatsapp')}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex mt-4">
        <button
          onClick={handleBack}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          onClick={handleNext}
          className={`px-5 py-2 rounded-md text-white transition-all duration-200 ${
            !canProceed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-lg'
          }`}
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)'
          }}
          disabled={!canProceed}
        >
          Próximo
        </button>
      </div>
    </div>
  )
}