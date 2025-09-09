import { differenceInCalendarDays, format, isThisWeek, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formats a date according to the following rules:
 * 1. If today: HH:mm (e.g., 10:23)
 * 2. If yesterday: "ontem"
 * 3. If within the last 7 days: abbreviated day of week (e.g., seg, ter, qua)
 * 4. If older than 7 days: DD/MM/YY (e.g., 03/05/25)
 */
export function formatLastMessageDate(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '--:--';
  }

  if (isToday(date)) {
    return format(date, 'HH:mm');
  }

  if (isYesterday(date)) {
    return 'ontem';
  }

  if (isThisWeek(date) && differenceInCalendarDays(new Date(), date) < 7) {
    return format(date, 'eee', { locale: ptBR });
  }

  return format(date, 'dd/MM/yy');
} 