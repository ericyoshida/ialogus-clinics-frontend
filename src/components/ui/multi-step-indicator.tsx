import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';

export interface MultiStepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function MultiStepIndicator({
  steps,
  currentStep,
  className,
}: MultiStepIndicatorProps) {
  // Configurações de gradiente para cada step
  const gradients = [
    { bg: 'linear-gradient(135deg, #F26C2C, #EE413D)', color: '#F26C2C' },
    { bg: 'linear-gradient(135deg, #EE413D, #E63F42)', color: '#EE413D' },
    { bg: 'linear-gradient(135deg, #E63F42, #D33952)', color: '#E63F42' },
    { bg: 'linear-gradient(135deg, #D33952, #B230BD)', color: '#D33952' },
    { bg: 'linear-gradient(135deg, #B230BD, #A51F76)', color: '#B230BD' },
  ];
  
  // Gradiente completo para steps finalizados
  const completedGradient = 'linear-gradient(135deg, #F26C2C, #B230BD)';

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        // Determine o gradiente a ser usado
        const backgroundGradient = isCompleted 
          ? completedGradient 
          : isActive 
          ? gradients[Math.min(index, gradients.length - 1)].bg
          : undefined;
        
        // Determine a cor do texto para o step ativo
        const textColor = isActive 
          ? gradients[Math.min(index, gradients.length - 1)].color
          : isCompleted 
          ? '#374151' 
          : '#6B7280';
        
        return (
          <React.Fragment key={index}>
            {/* Step circle */}
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                !isActive && !isCompleted && 'bg-gray-100 text-gray-400 border border-gray-200',
                (isActive || isCompleted) && 'text-white'
              )}
              style={backgroundGradient ? { background: backgroundGradient } : {}}
            >
              {isCompleted ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Step label */}
            <div className="hidden md:block ml-2 mr-auto">
              <p
                className="text-xs font-medium"
                style={{ color: textColor }}
              >
                {step}
              </p>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-[2px] mx-2',
                  !isCompleted && 'bg-gray-200'
                )}
                style={isCompleted ? { background: completedGradient } : {}}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
} 