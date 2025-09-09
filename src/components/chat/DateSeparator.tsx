import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const formatDate = (date: Date): string => {
    if (isToday(date)) {
      return 'Hoje';
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  return (
    <div className="flex items-center justify-center my-6 relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300/50"></div>
      </div>
      <div className="relative bg-[#e2f3ff] px-3 py-1.5 rounded-lg shadow-sm">
        <span className="text-xs text-gray-700 font-medium">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
} 