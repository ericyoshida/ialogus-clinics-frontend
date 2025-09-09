import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/solid';

export interface MultiStepIndicatorVerticalProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function MultiStepIndicatorVertical({
  steps,
  currentStep,
  className,
}: MultiStepIndicatorVerticalProps) {
  // Cores para os steps
  const completedGradient = 'linear-gradient(135deg, #F26C2C, #B230BD)';
  const activeGradient = 'linear-gradient(135deg, #F26C2C, #EE413D)';
  const grayColor = '#E5E7EB';
  
  return (
    <div className={cn('w-full', className)}>
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            // Determinar estado do step
            const isComplete = index < currentStep;
            const isActive = index === currentStep;
            
            // Cor do texto
            const textColor = isComplete
              ? '#B230BD'
              : isActive 
              ? '#F26C2C' 
              : '#6B7280';
            
            // Estilo do círculo
            const circleStyle = isComplete
              ? { background: completedGradient }
              : isActive
              ? { background: activeGradient }
              : { background: 'white', border: '1px solid #D1D5DB' };
            
            return (
              <div 
                key={`step-${index}`}
                className="flex flex-col items-center relative"
              >
                {/* Texto acima do círculo - visível apenas em LG para cima */}
                <div className="hidden lg:block mb-2 text-center max-w-[80px] mx-auto">
                  <span 
                    className="text-xs font-medium"
                    style={{ color: textColor }}
                  >
                    {step}
                  </span>
                </div>
                
                {/* Círculo */}
                <div
                  className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full shadow-sm z-10 bg-white"
                  style={circleStyle}
                >
                  {isComplete ? (
                    <CheckIcon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  ) : (
                    <span 
                      className="text-xs md:text-sm font-medium"
                      style={{ color: isActive ? 'white' : '#6B7280' }}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                
                {/* Barra entre os círculos */}
                {index < steps.length - 1 && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 hidden md:block"
                    style={{ 
                      left: "50%",
                      right: "-50%",
                      height: "3px",
                      marginLeft: "12px", // Metade do tamanho do círculo
                      marginRight: "12px", // Metade do tamanho do círculo
                      background: isComplete ? completedGradient : grayColor
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 