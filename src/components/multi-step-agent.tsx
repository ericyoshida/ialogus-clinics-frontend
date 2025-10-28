import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/solid';

interface MultiStepAgentProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

const threeSteps = [
  "Nome do Agente",
  "Catálogo de Produtos",
  "Informações Adicionais"
];

const fourSteps = [
  "Tipo de Agente",
  "Fluxo de Conversa",
  "Catálogo de Produtos",
  "Informações Adicionais"
];

export function MultiStepAgent({
  currentStep,
  totalSteps = 4,
  className,
}: MultiStepAgentProps) {
  // Selecionar o array de steps baseado no totalSteps
  const steps = totalSteps === 3 ? threeSteps : fourSteps;

  // Ajustar currentStep para base 0
  const adjustedStep = currentStep - 1;
  
  // Cores para os steps
  const completedGradient = 'linear-gradient(135deg, #F26C2C, #B230BD)';
  const activeGradient = 'linear-gradient(135deg, #F26C2C, #EE413D)';
  const grayColor = '#E5E7EB';

  // Classe de grid baseada no totalSteps
  const gridClass = totalSteps === 3 ? 'grid-cols-3' : 'grid-cols-4';

  // Calcular posições da linha dinamicamente baseado no número de steps
  // Para 3 steps: 16.67% de cada lado (100 / 6)
  // Para 4 steps: 12.5% de cada lado (100 / 8)
  const lineOffset = totalSteps === 3 ? '16.67%' : '12.5%';
  const lineMaxWidth = totalSteps === 3 ? 66.66 : 75; // 100 - (offset * 2)

  return (
    <div className={cn('w-full', className)}>
      {/* Container principal com grid para garantir alinhamento */}
      <div className="relative">
        {/* Container dos textos */}
        <div className={cn('grid gap-0 mb-2', gridClass)}>
          {steps.map((step, index) => {
            const isActive = index === adjustedStep;
            const isCompleted = index < adjustedStep;

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
          <div
            className="absolute top-[12px] md:top-[16px] h-[2px] bg-gray-200 z-0"
            style={{ left: lineOffset, right: lineOffset }}
          ></div>

          {/* Linha colorida para steps completos */}
          <div
            className="absolute top-[12px] md:top-[16px] h-[2px] z-0"
            style={{
              left: lineOffset,
              width: `${adjustedStep === 0 ? 0 : (adjustedStep / (steps.length - 1)) * lineMaxWidth}%`,
              background: completedGradient
            }}
          ></div>

          {/* Container dos círculos */}
          <div className={cn('grid gap-0', gridClass)}>
            {steps.map((_, index) => {
              const isCompleted = index < adjustedStep;
              const isActive = index === adjustedStep;
              
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