import { useEffect, useRef, useState } from 'react';

interface PlanCardProps {
  planName: string;
  stats: {
    label: string;
    value: string;
    max?: string;
  }[];
}

export function PlanCard({ planName, stats }: PlanCardProps) {
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
        src="/images/plan-card-bg.svg" 
        alt="Plan Background" 
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
              Plano atual
            </h3>
            <h2 className="text-xl font-bold text-white -mt-1">
              {planName}
            </h2>
          </div>
          
          <div className="max-w-[260px]">
            <table className="w-full">
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={index} className="h-8">
                    <td className="text-sm text-gray-300 pr-4">
                      {stat.label}
                    </td>
                    <td className="text-sm text-white font-medium text-right">
                      {stat.value}
                      {stat.max && `/${stat.max}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
