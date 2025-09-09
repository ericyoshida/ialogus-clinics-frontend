import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface AddChannelCardProps {
  onClick?: () => void;
  className?: string;
}

export function AddChannelCard({ onClick, className }: AddChannelCardProps) {
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
        aria-label="Adicionar novo canal"
      >
        <img 
          src="/images/add-channel.svg" 
          alt="Adicionar canal"
          style={imageStyle}
        />
      </button>
    </div>
  );
}