import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarEvent } from '@/services/calendar'
import { CalendarEventCard } from './CalendarEventCard'
import { cn } from '@/lib/utils'

interface CalendarDayViewProps {
  date: Date
  events: CalendarEvent[]
  onBack: () => void
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: () => void
}

const hours = Array.from({ length: 24 }, (_, i) => i)

export function CalendarDayView({ date, events, onBack, onEventClick, onCreateEvent }: CalendarDayViewProps) {
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0
    return a.startTime.localeCompare(b.startTime)
  })

  const allDayEvents = sortedEvents.filter(event => !event.startTime)
  const timedEvents = sortedEvents.filter(event => event.startTime)

  // Função para detectar conflitos entre eventos
  const getEventGroups = (events: CalendarEvent[]) => {
    const groups: CalendarEvent[][] = []
    
    events.forEach(event => {
      if (!event.startTime || !event.endTime) return
      
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      
      // Encontrar um grupo existente que tenha conflito com este evento
      let added = false
      for (const group of groups) {
        const hasConflict = group.some(groupEvent => {
          const groupStart = new Date(groupEvent.startTime)
          const groupEnd = new Date(groupEvent.endTime)
          return eventStart < groupEnd && eventEnd > groupStart
        })
        
        if (hasConflict) {
          group.push(event)
          added = true
          break
        }
      }
      
      // Se não encontrou conflito, criar novo grupo
      if (!added) {
        groups.push([event])
      }
    })
    
    return groups
  }

  const eventGroups = getEventGroups(timedEvents)

  const getEventPosition = (event: CalendarEvent) => {
    if (!event.startTime) return { top: 0, height: 60 }
    
    const startDate = new Date(event.startTime)
    if (isNaN(startDate.getTime())) return { top: 0, height: 60 }
    
    const hours = startDate.getHours()
    const minutes = startDate.getMinutes()
    const startMinutes = hours * 60 + minutes
    const top = (startMinutes / 60) * 60 // 60px per hour
    
    if (event.endTime) {
      const endDate = new Date(event.endTime)
      if (!isNaN(endDate.getTime())) {
        const endHours = endDate.getHours()
        const endMinutes = endDate.getMinutes()
        const endTotalMinutes = endHours * 60 + endMinutes
        const duration = endTotalMinutes - startMinutes
        const height = (duration / 60) * 60
        return { top, height }
      }
    }
    
    return { top, height: 60 } // Default 1 hour
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">
              {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <p className="text-sm text-gray-500">
              {format(date, 'EEEE', { locale: ptBR })}
            </p>
          </div>
        </div>
        <Button onClick={onCreateEvent} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Criar
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* All day events */}
        {allDayEvents.length > 0 && (
          <div className="border-b p-4">
            <div className="text-xs text-gray-500 mb-2">Dia todo</div>
            <div className="space-y-1">
              {allDayEvents.map(event => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timed events */}
        <div className="relative">
          {/* Hour lines */}
          {hours.map(hour => (
            <div
              key={hour}
              className="flex border-b border-gray-100"
              style={{ height: '60px' }}
            >
              <div className="w-16 pr-2 text-right text-xs text-gray-500 pt-1">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 border-l border-gray-100" />
              </div>
            </div>
          ))}

          {/* Events overlay */}
          <div className="absolute inset-0 left-16 pr-4">
            {eventGroups.map((group, groupIndex) => {
              const groupWidth = 100 / group.length
              
              return group.map((event, eventIndex) => {
                const { top, height } = getEventPosition(event)
                const left = eventIndex * groupWidth
                
                return (
                  <div
                    key={event.id}
                    className="absolute"
                    style={{ 
                      top: `${top}px`, 
                      height: `${height}px`,
                      left: `${left}%`,
                      width: `${groupWidth}%`,
                      paddingRight: eventIndex < group.length - 1 ? '2px' : '0',
                      paddingLeft: eventIndex > 0 ? '2px' : '0'
                    }}
                  >
                    <div className="h-full">
                      <CalendarEventCard
                        event={event}
                        onClick={() => onEventClick(event)}
                        showTime
                      />
                    </div>
                  </div>
                )
              })
            })}
          </div>
        </div>
      </div>
    </div>
  )
}