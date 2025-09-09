import { FeatureCard } from '@/components/ui/feature-card';
import { cn } from '@/lib/utils';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';

// Componentes de ícones simplificados para evitar problemas de importação
const ChatIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={cn("text-blue-500", className)}
  >
    <path 
      fillRule="evenodd" 
      d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" 
      clipRule="evenodd" 
    />
  </svg>
);

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

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={cn("text-pink-500", className)}
  >
    <path 
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" 
    />
  </svg>
);

export interface AgentCardProps {
  name: string;
  description?: string;
  image?: string;
  color?: string;
  onClick?: () => void;
  className?: string;
  conversationsToday?: number;
  activeChannels?: string[];
  type?: string;
  showMenu?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

// Ícones dos canais de comunicação
const ChannelIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'chat':
      return <ChatIcon className="w-4 h-4" />;
    case 'whatsapp':
      return <WhatsAppIcon className="w-4 h-4" />;
    case 'instagram':
      return <InstagramIcon className="w-4 h-4" />;
    default:
      return <ChatIcon className="w-4 h-4" />;
  }
};

// Componente personalizado para exibir o card de agente
export function AgentCard({ 
  name, 
  image, 
  color = '#4F46E5', 
  onClick, 
  className,
  conversationsToday = 0,
  activeChannels = ['chat'],
  type,
  showMenu = false,
  onEdit,
  onDelete,
  editLabel = "Editar",
  deleteLabel = "Deletar"
}: AgentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Processar canais ativos para remover duplicatas e garantir que sempre haja pelo menos um
  const processedChannels = activeChannels.length > 0 
    ? [...new Set(activeChannels)] // Remove duplicatas
    : ['chat']; // Fallback para chat se não houver canais
  
  // Função para criar iniciais a partir do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Determinar o tipo de agente: apenas "Vendas" ou "Suporte ao Cliente"
  const agentType = type || (
    name.toLowerCase().includes('venda') || 
    name.toLowerCase().includes('marketing') || 
    name.toLowerCase().includes('produto') || 
    name.toLowerCase().includes('especialista')
      ? 'Vendas' 
      : 'Suporte ao Cliente'
  );

  // Determinar qual imagem usar baseado no tipo de agente
  const getAgentImagePath = () => {
    return agentType === 'Vendas' 
      ? '/images/sales-image.svg' 
      : '/images/customer-service-image.svg';
  };

  // Determinar a cor do card baseado no tipo
  const getCardGradientColors = () => {
    if (agentType === 'Vendas') {
      // Cores laranja para vendas
      return { from: '#F59E0B', to: '#EA580C' };
    } else {
      // Cores azul para suporte ao cliente
      return { from: '#3B82F6', to: '#1E40AF' };
    }
  };

  // Criar o ícone personalizado com as iniciais ou imagem
  const agentIcon = (
    <div 
      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
      style={{ background: color }}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );

  // Definir estilos personalizados para o SVG
  const customSvgStyle = {
    bottom: '-18px',
    right: '-5px',
  };

  return (
    <div ref={cardRef} className="h-full w-full">
      <FeatureCard
        title={name}
        subtitle="Agente de IA"
        icon={<UserCircleIcon />}
        gradientColors={getCardGradientColors()}
        decorativeElement="svg"
        svgPath={getAgentImagePath()}
        className={cn("w-full h-full", className)}
        onClick={onClick}
        svgStyle={customSvgStyle} // Passa os estilos customizados para o FeatureCard
        showMenu={showMenu}
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
      >
        {/* Status e métricas - posicionadas pelo FeatureCard no fundo do card */}
        <div>
          {/* Tipo de agente - novo elemento */}
          <div className="mb-3">
            <span className="inline-block px-2.5 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full">
              {agentType}
            </span>
          </div>
          
          {/* Canais ativos */}
          <div className="flex items-center mb-1">
            <span className="text-xs font-medium text-gray-600 mr-2">Ativo em:</span>
            <div className="flex gap-1">
              {processedChannels.map((channel, index) => (
                <div key={index} className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full">
                  <ChannelIcon type={channel} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Contagem de conversas */}
          <div className="text-xs text-gray-500">
            {conversationsToday} {conversationsToday === 1 ? 'conversa hoje' : 'conversas hoje'}
          </div>
        </div>
      </FeatureCard>
    </div>
  );
} 