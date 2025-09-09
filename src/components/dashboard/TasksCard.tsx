import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

interface TasksCardProps {
  count: number;
  description: string;
  onClick?: () => void;
}

export function TasksCard({ count, description, onClick }: TasksCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [animationProgress, setAnimationProgress] = React.useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Função para animar com curva de easing personalizada
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Se hover foi acionado, animar de 0 para 1
    // Se hover foi removido, animar de 1 para 0
    const targetValue = isHovered ? 1 : 0;
    const startValue = animationProgress;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const duration = 500; // duração em ms (mais rápido para parecer mais fluido)
      
      // Calcular progresso com função de easing
      let progress = elapsed / duration;
      
      if (progress < 1) {
        // Aplicar easing cubic-bezier para movimento mais natural
        progress = isHovered 
          ? easeOutCubic(progress) // Easing mais rápido no início para hover
          : easeInOutQuad(progress); // Easing suave para saída do hover
        
        // Interpolar entre o valor inicial e o alvo
        const currentValue = startValue + (targetValue - startValue) * progress;
        setAnimationProgress(currentValue);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimationProgress(targetValue);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered]);

  // Funções de easing para movimento mais natural
  const easeOutCubic = (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
  };

  const easeInOutQuad = (x: number): number => {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  };

  // Transformação fixa em 3D para os elementos decorativos
  const getFixedTransform = () => {
    return {
      transform: isHovered 
        ? 'perspective(1000px) rotateX(10deg) rotateY(-15deg) scale(1.12) translateZ(35px) translateX(15px) translateY(15px)' 
        : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px) translateX(0px) translateY(0px)',
      transition: 'transform 0.5s ease-out, filter 0.5s ease-out',
      transformOrigin: 'center center'
    };
  };

  // Efeito de sombra para o SVG
  const getDecorativeShadow = () => {
    if (!isHovered) return '';
    return 'drop-shadow(0px 10px 30px rgba(0,0,0,0.15))';
  };
  
  return (
    <div 
      className={cn(
        "w-full h-full aspect-square relative bg-white rounded-lg shadow-[2px_3px_10px_rgba(0,0,0,0.08)] cursor-pointer",
        "transition-shadow duration-300 ease-out overflow-visible",
        animationProgress > 0.5 && "shadow-[0px_10px_25px_rgba(0,0,0,0.12)]"
      )}
      style={{ transformStyle: 'preserve-3d' }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => {
        setIsPressed(false);
        if (onClick) onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
    >
      {/* Conteúdo do card */}
      <div className="p-5 h-full flex flex-col" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(10px)', position: 'relative', zIndex: 20 }}>
        {/* Cabeçalho com título */}
        <div className="mb-4">
          <h3 className="text-[#4100f5] text-xl font-bold">
            {count} Tarefas Pendentes
          </h3>
        </div>
        
        {/* Descrição */}
        <div className="mt-2">
          <p className="text-gray-600 text-xs leading-snug max-h-24 overflow-hidden">
            {description}
          </p>
        </div>
      </div>
      
      {/* Elemento decorativo (SVG) - com animação idêntica ao FeatureCard */}
      <div 
        className="absolute bottom-0 right-0"
        style={{ 
          transformStyle: 'preserve-3d',
          width: '160px',
          height: '160px',
          bottom: '-5px',
          right: '-5px',
          zIndex: 30,
          filter: isHovered ? getDecorativeShadow() : `drop-shadow(0px ${4 * animationProgress}px ${6 * animationProgress}px rgba(0,0,0,${0.15 * animationProgress}))`
        }}
      >
        <div 
          className="w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            ...getFixedTransform(),
            backgroundImage: "url('/images/tasks.svg')",
            backgroundSize: 'contain',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Overlay de gradiente no hover - cobre todo o card */}
      <div 
        className="absolute inset-0 rounded-lg transition-all duration-300 ease-out"
        style={{
          background: `linear-gradient(90deg, rgba(255,255,255,0) 20%, #4100f5 100%)`,
          opacity: isHovered ? 0.25 : 0,
          transformStyle: 'preserve-3d',
          zIndex: 10
        }}
      />
      
      {/* Overlay para o estado pressionado - cobre todo o card */}
      <div 
        className="absolute inset-0 rounded-lg transition-all duration-200 ease-out"
        style={{
          background: `linear-gradient(135deg, #4100f5 0%, rgba(255,255,255,0) 70%)`,
          opacity: isPressed ? 0.8 : 0,
          transformStyle: 'preserve-3d',
          zIndex: 15
        }}
      />
    </div>
  );
}
