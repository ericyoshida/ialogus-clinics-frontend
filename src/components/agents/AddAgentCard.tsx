import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';

interface AddAgentCardProps {
  onClick?: () => void;
  className?: string;
}

export function AddAgentCard({ onClick, className }: AddAgentCardProps) {
  // Get companyId from URL params
  const { companyId } = useParams<{ companyId: string }>();
  
  // Estilos para o container principal (card)
  const containerStyle: CSSProperties = {
    width: '250px',
    height: '250px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    margin: '0 auto'
  };

  // Estilos para a imagem - mantendo tamanho original mas centralizando
  const imageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center center'
  };

  // Se tiver onClick, usar um botão, caso contrário usar um Link
  if (onClick) {
    return (
      <div style={{ width: '250px', height: '250px', margin: '0 auto' }}>
        <button
          onClick={onClick}
          style={containerStyle}
          className={cn(
            "bg-transparent border-none outline-none focus:outline-none cursor-pointer",
            "transition-all duration-300 ease-in-out",
            "hover:scale-[1.02] hover:drop-shadow-[6px_6px_10px_rgba(0,0,0,0.15)]",
            className
          )}
          aria-label="Adicionar novo agente"
        >
          <img 
            src="/images/add-agent.svg" 
            alt="Adicionar agente"
            style={imageStyle}
          />
        </button>
      </div>
    );
  }

  // Criar o caminho da URL com o companyId da URL atual
  const to = companyId 
    ? `/dashboard/company/${companyId}/agents/create` 
    : '/dashboard/agents/create/company';

  // Versão com Link para navegação direta
  return (
    <div style={{ width: '250px', height: '250px', margin: '0 auto' }}>
      <Link
        to={to}
        style={containerStyle as React.CSSProperties}
        className={cn(
          "bg-transparent border-none outline-none focus:outline-none cursor-pointer",
          "transition-all duration-300 ease-in-out",
          "hover:scale-[1.02] hover:drop-shadow-[6px_6px_10px_rgba(0,0,0,0.15)]",
          "flex items-center justify-center",
          className
        )}
        aria-label="Adicionar novo agente"
      >
        <img 
          src="/images/add-agent.svg" 
          alt="Adicionar agente"
          style={imageStyle}
        />
      </Link>
    </div>
  );
} 