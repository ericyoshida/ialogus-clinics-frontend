import { useEffect, useRef, useState } from 'react';

interface WelcomeCardProps {
  name?: string;
  isLoading?: boolean;
}

export function WelcomeCard({ name, isLoading = false }: WelcomeCardProps) {
  // Reference for the card and content
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // State for scaling
  const [scale, setScale] = useState(1);
  const FIXED_SIZE = 325; // Fixed size in pixels
  
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

  return (
    <div 
      ref={cardRef}
      className="rounded-lg overflow-hidden shadow-md h-full w-full relative aspect-square"
    >
      <img 
        src="/images/card-bg.svg" 
        alt="Ialogus Background" 
        className="w-full h-full object-cover absolute inset-0"
      />
      
      {/* Fixed-size content container that will be scaled */}
      <div
        ref={contentRef}
        className="w-[325px] h-[325px] origin-top-left relative"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
          <div>
            <h3 className="text-xl font-light text-white">
              Bem-vindo
            </h3>
            {isLoading || !name ? (
              <div className="h-7 w-32 bg-white/20 rounded animate-pulse -mt-1" />
            ) : (
              <h2 className="text-xl font-bold text-white -mt-1">
                {name}
              </h2>
            )}
          </div>

          <div className="max-w-[180px]">
            <p className="text-sm text-white/90 font-light">
              Ialogus está aqui para levar seu atendimento
            </p>
            <p className="text-sm text-white/90 font-light">
              para outro nível.
            </p>

            <p className="text-sm text-white/90 font-bold mt-3">
              Ialogus, conectando negócios e pessoas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
