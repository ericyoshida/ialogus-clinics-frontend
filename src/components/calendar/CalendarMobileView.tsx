import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarEvent } from '@/services/calendar'
import { CalendarEventCard } from './CalendarEventCard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface CalendarMobileViewProps {
  events: CalendarEvent[]
  currentDate: Date
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: () => void
}

export function CalendarMobileView({ events, currentDate, onEventClick, onCreateEvent }: CalendarMobileViewProps) {
  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    if (!event.startTime) return acc
    const eventDate = new Date(event.startTime)
    if (isNaN(eventDate.getTime())) return acc
    
    const dateKey = format(eventDate, 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  // Get dates with events for the current month
  const monthDates = Object.keys(eventsByDate)
    .filter(dateKey => {
      const date = new Date(dateKey)
      return date.getMonth() === currentDate.getMonth() && 
             date.getFullYear() === currentDate.getFullYear()
    })
    .sort()

  return (
    <div className="space-y-4">
      <div className="fixed bottom-4 right-4 z-10 lg:hidden">
        <Button onClick={onCreateEvent} size="icon" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {monthDates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum evento este mês
        </div>
      ) : (
        monthDates.map(dateKey => {
          const date = new Date(dateKey)
          const dayEvents = eventsByDate[dateKey]

          return (
            <div key={dateKey} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="mb-3">
                <h3 className="font-medium text-gray-900">
                  {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h3>
              </div>
              <div className="space-y-2">
                {dayEvents.map(event => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                    showTime
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}