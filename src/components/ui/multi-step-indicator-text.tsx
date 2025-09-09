import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/solid';

export interface MultiStepIndicatorTextProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function MultiStepIndicatorText({
  steps,
  currentStep,
  className,
}: MultiStepIndicatorTextProps) {
  // Cores para os steps
  const completedGradient = 'linear-gradient(135deg, #F26C2C, #B230BD)';
  const activeGradient = 'linear-gradient(135deg, #F26C2C, #EE413D)';
  const grayColor = '#E5E7EB';

  // Determinar o número de colunas dinamicamente
  const getGridCols = (numSteps: number) => {
    switch (numSteps) {
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      case 5: return 'grid-cols-5';
      default: return 'grid-cols-3';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Container principal com grid para garantir alinhamento */}
      <div className="relative">
        {/* Container dos textos */}
        <div className={cn("grid gap-0 mb-2", getGridCols(steps.length))}>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            // Cor do texto
            const textColor = isCompleted
              ? '#B230BD'
              : isActive 
              ? '#F26C2C' 
              : '#6B7280';
            
            return (
              <div key={`text-${index}`} className="flex flex-col items-center">
                <span 
                  className="text-xs font-medium max-w-[80px] text-center hidden md:block"
                  style={{ color: textColor }}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Linha base que liga todos os steps */}
        <div className="relative">
          <div className="absolute left-[16.67%] right-[16.67%] top-[12px] md:top-[16px] h-[2px] bg-gray-200 z-0"></div>
          
          {/* Linha colorida para steps completos */}
          <div 
            className="absolute left-[16.67%] top-[12px] md:top-[16px] h-[2px] z-0"
            style={{
              width: `${currentStep === 0 ? 0 : (currentStep / (steps.length - 1)) * 66.66}%`,
              background: completedGradient
            }}
          ></div>
          
          {/* Container dos círculos */}
          <div className={cn("grid gap-0", getGridCols(steps.length))}>
            {steps.map((_, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              
              // Estilo do círculo
              const circleStyle = isCompleted
                ? { background: completedGradient }
                : isActive
                ? { background: activeGradient }
                : { background: 'white', border: '1px solid #D1D5DB' };
              
              return (
                <div key={`step-${index}`} className="flex justify-center">
                  <div
                    className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-medium z-10 relative bg-white"
                    style={circleStyle}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    ) : (
                      <span className="text-xs md:text-sm font-medium" style={{ color: isActive ? 'white' : '#6B7280' }}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 