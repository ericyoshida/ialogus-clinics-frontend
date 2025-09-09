import { cn } from '@/lib/utils';

type InteractionStatsProps = {
  daysOpen: number;
  daysWithoutInteraction: number;
  interactions: number;
  chartData: number[];
};

export function InteractionStats({
  daysOpen,
  daysWithoutInteraction,
  interactions,
  chartData
}: InteractionStatsProps) {
  // Cores para os segmentos da barra (seguindo o mesmo padrão de cores da LeadTemperatureBar)
  const colors = ['#E23C3C', '#F6B340', '#42B74A'];
  
  // Cria um array para os segmentos baseado nos dados do gráfico
  const segments = chartData.map((value, index) => ({
    value,
    color: colors[index % colors.length]
  }));
  
  // Calcula o total para determinar as proporções
  const total = chartData.reduce((sum, value) => sum + value, 0);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Dados de interação</h3>
      </div>
      <div className="h-0.5 w-full bg-gray-200 mb-4" />

      {/* Barra de temperatura seguindo o estilo da LeadTemperatureBar */}
      <div className="flex gap-0.5 w-full h-1.5 mb-4">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="rounded-sm h-1.5"
            style={{
              flexGrow: segment.value,
              backgroundColor: segment.color
            }}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Dias aberto</span>
          <span className={cn("text-sm font-medium", daysOpen > 10 ? "text-red-500" : "text-gray-700")}>
            {daysOpen.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Dias sem interação</span>
          <span className={cn("text-sm font-medium", daysWithoutInteraction > 1 ? "text-red-500" : "text-gray-700")}>
            {daysWithoutInteraction.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Interações</span>
          <span className="text-sm font-medium text-gray-700">
            {interactions.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
} 