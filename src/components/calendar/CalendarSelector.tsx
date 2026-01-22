import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { CalendarWithUser } from '@/services/calendar'

interface CalendarSelectorProps {
  calendars: CalendarWithUser[]
  selectedCalendarId: string | null
  onSelect: (calendarId: string) => void
  isLoading?: boolean
}

export function CalendarSelector({
  calendars,
  selectedCalendarId,
  onSelect,
  isLoading = false
}: CalendarSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Calendários</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-lg animate-pulse"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (calendars.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Calendários</h3>
        <p className="text-sm text-gray-400 italic">
          Nenhum calendário encontrado
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Calendários</h3>
      <div className="space-y-1">
        {calendars.map((calendar) => {
          const isSelected = selectedCalendarId === calendar.calendarId
          const initials = calendar.user.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()

          return (
            <button
              key={calendar.calendarId}
              onClick={() => onSelect(calendar.calendarId)}
              className={cn(
                'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                isSelected
                  ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'
                  : 'hover:bg-gray-100'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className={cn(
                    'text-xs font-medium',
                    isSelected
                      ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    isSelected ? 'text-orange-600' : 'text-gray-700'
                  )}
                >
                  {calendar.user.name}
                </p>
                {calendar.googleCalendarId && (
                  <p className="text-xs text-gray-400 truncate">
                    Google Calendar conectado
                  </p>
                )}
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
