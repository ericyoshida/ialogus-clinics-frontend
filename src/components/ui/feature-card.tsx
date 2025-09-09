import { cn } from "@/lib/utils";
import { darken } from 'polished';
import React, { useEffect, useRef, useState } from 'react';

export interface FeatureCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  gradientColors?: {
    from: string;
    to: string;
  };
  decorativeElement?: 'circle' | 'cloud' | 'square' | 'svg';
  svgPath?: string;
  svgStyle?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  showMenu?: boolean;
  editLabel?: string;
  deleteLabel?: string;
}

export function FeatureCard({
  title,
  subtitle,
  description,
  icon,
  gradientColors = { from: '#EB9B45', to: '#E05C5C' },
  decorativeElement = 'circle',
  svgPath,
  svgStyle,
  className,
  onClick,
  children,
  onEdit,
  onDelete,
  showMenu = false,
  editLabel = "Editar",
  deleteLabel = "Deletar",
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Reference for the card and content container
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // State for scaling
  const [scale, setScale] = useState(1);
  const FIXED_SIZE = 325; // Fixed size for the content (325x325 pixels)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  // Use ResizeObserver to adjust scale based on card size
  useEffect(() => {
    if (!cardRef.current || !contentRef.current) return;
    
    const calculateScale = () => {
      if (!cardRef.current) return;
      
      const cardWidth = cardRef.current.clientWidth;
      const cardHeight = cardRef.current.clientHeight;
      
      // Calculate scale based on the smallest dimension ratio
      const widthRatio = cardWidth / FIXED_SIZE;
      const heightRatio = cardHeight / FIXED_SIZE;
      const newScale = Math.min(widthRatio, heightRatio);
      
      setScale(newScale);
    };
    
    // Calculate scale initially
    calculateScale();
    
    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
    });
    
    resizeObserver.observe(cardRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't trigger card press if clicking on menu
    if ((e.target as HTMLElement).closest('[data-menu]')) {
      return;
    }
    setIsPressed(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on menu
    if ((e.target as HTMLElement).closest('[data-menu]')) {
      return;
    }
    setIsPressed(false);
    if (onClick) onClick();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onEdit) onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) onDelete();
  };
  
  // Cor base do elemento decorativo
  const decorativeColor = `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`;
  
  // Cor principal para títulos e ícones (versão mais escura da cor principal)
  const primaryColor = gradientColors.from;
  const primaryColorDark = typeof primaryColor === 'string' 
    ? darken(0.1, primaryColor) // Escurece a cor 10%
    : primaryColor;
  
  // Interpolação de cor para os elementos de texto
  const getColorStyle = (baseColor: string, hoverColor: string) => {
    const interpolatedColor = isHovered 
      ? hoverColor 
      : baseColor;
    
    return {
      color: interpolatedColor,
      transition: 'color 300ms ease-out'
    };
  };

  // Efeito de sombra baseado no elemento decorativo
  const getDecorativeShadow = (type: 'circle' | 'cloud' | 'square' | 'svg') => {
    if (!isHovered) return '';
    
    // Sombra mais suave e uniforme para todos os tipos
    return 'drop-shadow(0px 10px 30px rgba(0,0,0,0.15))';
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
  
  // Tamanho do elemento decorativo baseado no scale
  const getDecorativeSize = (baseSize: number) => {
    return baseSize * scale;
  };
  
  return (
    <div 
      ref={cardRef}
      className={cn(
        "bg-white rounded-lg shadow-[2px_3px_10px_rgba(0,0,0,0.08)] relative flex flex-col",
        "w-full aspect-square overflow-visible",
        animationProgress > 0.5 && "shadow-[0px_10px_25px_rgba(0,0,0,0.12)]",
        onClick && "cursor-pointer",
        className
      )}
      style={{ 
        transformStyle: 'preserve-3d',
        transition: 'box-shadow 0.5s ease-out'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Overlay de gradiente no hover - cobre todo o card */}
      <div 
        className="absolute inset-0 z-5 rounded-lg transition-all duration-300 ease-out"
        style={{
          background: `linear-gradient(90deg, rgba(255,255,255,0) 20%, ${gradientColors.from} 100%)`,
          opacity: isHovered ? 0.25 : 0,
          transformStyle: 'preserve-3d'
        }}
      />
      
      {/* Overlay para o estado pressionado - cobre todo o card */}
      <div 
        className="absolute inset-0 z-6 rounded-lg transition-all duration-200 ease-out"
        style={{
          background: `linear-gradient(135deg, ${gradientColors.from} 0%, rgba(255,255,255,0) 70%)`,
          opacity: isPressed ? 0.8 : 0,
          transformStyle: 'preserve-3d'
        }}
      />
  
      {/* Fixed-size content container that will be scaled */}
      <div 
        ref={contentRef}
        className="w-[325px] h-[325px] origin-top-left relative z-10"
        style={{ 
          transform: `scale(${scale})`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Conteúdo principal */}
        <div className="absolute inset-0 p-5 z-20 flex flex-col" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(10px)' }}>
          {/* Three-dot menu or icon */}
          <div className="absolute top-5 right-5 z-30" data-menu>
            {showMenu && (onEdit || onDelete) ? (
              <div ref={menuRef} className="relative">
                <button
                  onClick={handleMenuClick}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200 rounded-full hover:bg-gray-100"
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    {onEdit && (
                      <button
                        onClick={handleEditClick}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={handleDeleteClick}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                        Deletar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : icon ? (
              <div 
                className="transition-colors duration-300"
                style={{
                  ...getColorStyle("currentColor", primaryColorDark),
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(20px)',
                  width: '24px',
                  height: '24px'
                }}
              >
                {React.cloneElement(icon as React.ReactElement, { 
                  style: { 
                    color: isHovered ? primaryColorDark : 'currentColor',
                    transition: 'color 300ms ease-out',
                    width: '100%',
                    height: '100%'
                  },
                  className: cn((icon as React.ReactElement).props.className, "") 
                })}
              </div>
            ) : null}
          </div>
          
          <div className="mt-2 pr-2 w-[190px] min-h-[70px]" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(15px)' }}>
            {subtitle && (
              <h4 
                className="text-gray-500 font-normal break-words transition-colors duration-300 text-base"
                style={{ 
                  ...(isHovered ? { color: primaryColor } : {})
                }}
              >
                {subtitle}
              </h4>
            )}
            <h3 
              className="text-gray-600 font-normal break-words max-w-full transition-colors duration-300 text-xl"
              style={getColorStyle("#374151", primaryColorDark)}
            >
              {title}
            </h3>
          </div>
          
          {description && (
            <p 
              className="text-gray-700 mt-7 w-[190px] text-sm" 
              style={{ 
                transformStyle: 'preserve-3d', 
                transform: 'translateZ(15px)'
              }}
            >
              {description}
            </p>
          )}
          
          {/* Conteúdo filho (children) posicionado absolutamente no fundo do card */}
          {children && (
            <div 
              className="absolute bottom-5 left-5 right-5 z-20"
              style={{ 
                transformStyle: 'preserve-3d', 
                transform: 'translateZ(15px)'
              }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative elements - positioned absolutely relative to the main card container */}
      {decorativeElement === 'circle' && (
        <div 
          className="absolute bottom-0 right-0 z-10"
          style={{ 
            transformStyle: 'preserve-3d',
            width: `${getDecorativeSize(160)}px`,
            height: `${getDecorativeSize(160)}px`,
            bottom: `${-5 * scale}px`,
            right: `${-5 * scale}px`,
            filter: isHovered ? getDecorativeShadow('circle') : `drop-shadow(0px ${4 * animationProgress}px ${6 * animationProgress}px rgba(0,0,0,${0.15 * animationProgress}))`
          }}
        >
          <div 
            className="rounded-full w-full h-full"
            style={{
              background: decorativeColor,
              transformStyle: 'preserve-3d',
              ...getFixedTransform()
            }}
          />
        </div>
      )}
      
      {decorativeElement === 'square' && (
        <div 
          className="absolute bottom-0 right-0 z-10"
          style={{ 
            transformStyle: 'preserve-3d',
            width: `${getDecorativeSize(130)}px`,
            height: `${getDecorativeSize(130)}px`,
            bottom: `${-5 * scale}px`,
            right: `${-5 * scale}px`,
            filter: isHovered ? getDecorativeShadow('square') : `drop-shadow(0px ${4 * animationProgress}px ${6 * animationProgress}px rgba(0,0,0,${0.15 * animationProgress}))`
          }}
        >
          <div 
            className="w-full h-full"
            style={{
              background: decorativeColor,
              transformStyle: 'preserve-3d',
              ...getFixedTransform()
            }}
          />
        </div>
      )}
      
      {decorativeElement === 'cloud' && (
        <div 
          className="absolute bottom-0 right-0 z-10"
          style={{ 
            transformStyle: 'preserve-3d',
            width: `${getDecorativeSize(180)}px`,
            height: `${getDecorativeSize(140)}px`,
            bottom: `${-5 * scale}px`,
            right: `${-5 * scale}px`,
            filter: isHovered ? getDecorativeShadow('cloud') : `drop-shadow(0px ${4 * animationProgress}px ${6 * animationProgress}px rgba(0,0,0,${0.15 * animationProgress}))`
          }}
        >
          <div 
            className="w-full h-full"
            style={{
              background: decorativeColor,
              borderRadius: '60% 60% 0 0',
              transformStyle: 'preserve-3d',
              ...getFixedTransform()
            }}
          />
        </div>
      )}

      {/* Suporte para SVG personalizado */}
      {decorativeElement === 'svg' && svgPath && (
        <div 
          className="absolute bottom-0 right-0 z-10"
          style={{ 
            transformStyle: 'preserve-3d',
            width: svgStyle?.width || `${getDecorativeSize(160)}px`,
            height: svgStyle?.height || `${getDecorativeSize(160)}px`,
            bottom: svgStyle?.bottom || `${-5 * scale}px`,
            right: svgStyle?.right || `${-5 * scale}px`,
            filter: isHovered ? getDecorativeShadow('svg') : 'none'
          }}
        >
          <div 
            className="w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              ...getFixedTransform(),
              backgroundImage: `url(${svgPath})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none'
            }}
          />
        </div>
      )}
    </div>
  );
} 