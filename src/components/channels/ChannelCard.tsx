import { FeatureCard } from '@/components/ui/feature-card';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { formatPhoneNumber } from '@/utils/phone';

// Componentes de ícones simplificados para evitar problemas de importação
// Componente WhatsApp Icon customizado para o canto superior
const WhatsAppIconTop = ({ className }: { className?: string }) => (
  <img 
    src="/images/icons/whatsapp.svg"
    alt="WhatsApp"
    className={cn("w-6 h-6", className)}
  />
);

// Ícone verde do WhatsApp para o número de telefone
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={cn("text-green-500", className)}
  >
    <path 
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" 
    />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={cn("text-gray-500", className)}
  >
    <path 
      fillRule="evenodd" 
      d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" 
      clipRule="evenodd" 
    />
  </svg>
);

export interface ChannelCardProps {
  name: string;
  phoneNumber: string;
  region?: string;
  connectedAgents?: number;
  status?: 'active' | 'inactive';
  type?: 'sales' | 'support';
  onClick?: () => void;
  className?: string;
  showMenu?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

// Componente personalizado para exibir o card de canal
export function ChannelCard({ 
  name, 
  phoneNumber,
  region = 'Brasil',
  connectedAgents = 0,
  status = 'active',
  type,
  onClick, 
  className,
  showMenu = false,
  onEdit,
  onDelete,
  editLabel = "Editar",
  deleteLabel = "Deletar"
}: ChannelCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Determinar o tipo de canal baseado no nome ou no tipo fornecido
  const channelType = type || (
    name && (
      name.toLowerCase().includes('venda') || 
      name.toLowerCase().includes('marketing') || 
      name.toLowerCase().includes('comercial')
    ) ? 'sales' : 'support'
  );

  // Usar imagem do WhatsApp para canais
  const getChannelImagePath = () => {
    return '/images/whatsapp-image.svg';
  };

  // Manter as cores verdes para WhatsApp
  const getCardGradientColors = () => {
    return { from: '#10B981', to: '#059669' }; // Verde para WhatsApp
  };

  // Definir estilos personalizados para o SVG
  const customSvgStyle = {
    bottom: '-18px',
    right: '-5px',
    width: '128px', // 80% de 160px
    height: '128px' // 80% de 160px
  };

  return (
    <div ref={cardRef} className="h-full w-full">
      <FeatureCard
        title={name || 'Canal sem nome'}
        subtitle="Canal WhatsApp"
        icon={<WhatsAppIconTop />}
        gradientColors={getCardGradientColors()}
        decorativeElement="svg"
        svgPath={getChannelImagePath()}
        className={cn("w-full h-full", className)}
        onClick={onClick}
        svgStyle={customSvgStyle}
        showMenu={showMenu}
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
      >
        {/* Status e informações - posicionadas pelo FeatureCard no fundo do card */}
        <div>
          {/* Status do canal */}
          <div className="mb-3">
            <span className={cn(
              "inline-block px-2.5 py-0.5 text-xs font-medium rounded-full",
              status === 'active' 
                ? "text-green-700 bg-green-100 border border-green-200"
                : "text-gray-700 bg-gray-100 border border-gray-200"
            )}>
              {status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          
          {/* Número de telefone com ícone do WhatsApp */}
          <div className="flex items-center mb-1">
            <WhatsAppIcon className="w-4 h-4 mr-2" />
            <span className="text-xs font-medium text-gray-600">
              {phoneNumber ? formatPhoneNumber(phoneNumber) : 'Sem número'}
            </span>
          </div>
          
          {/* Agentes conectados */}
          <div className="flex items-center text-xs text-gray-500">
            <UserIcon className="w-3 h-3 mr-1" />
            {connectedAgents} {connectedAgents === 1 ? 'agente conectado' : 'agentes conectados'}
          </div>
        </div>
      </FeatureCard>
    </div>
  );
}