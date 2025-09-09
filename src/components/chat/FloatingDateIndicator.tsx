import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRef } from 'react';

interface FloatingDateIndicatorProps {
  date: Date;
  show: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}

export function FloatingDateIndicator({ date, show, containerRef }: FloatingDateIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date): string => {
    if (isToday(date)) {
      return 'Hoje';
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  // Se não tiver containerRef ou show for false, não renderizar
  if (!containerRef?.current || !show) {
    return null;
  }

  // Calcular posição em tempo real sem state para evitar animação
  const container = containerRef.current;
  const rect = container.getBoundingClientRect();
  
  return (
    <div 
      ref={indicatorRef}
      className={`fixed z-50 transition-opacity duration-300 ease-in-out pointer-events-none ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        top: `${rect.top + 20}px`,
        left: `${rect.left + (rect.width / 2)}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl shadow-2xl border border-gray-700/50">
        <span className="text-sm font-semibold whitespace-nowrap">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
} 