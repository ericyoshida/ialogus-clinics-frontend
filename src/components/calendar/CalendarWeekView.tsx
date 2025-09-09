import { useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, addHours, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarEvent } from '@/services/calendar'
import { CalendarEventCard } from './CalendarEventCard'

interface CalendarWeekViewProps {
  currentWeek: Date
  events: CalendarEvent[]
  onBack: () => void
  onEventClick: (event: CalendarEvent) => void
  onNavigateWeek: (direction: 'prev' | 'next') => void
  onCreateEvent: () => void
}

export function CalendarWeekView({ 
  currentWeek, 
  events, 
  onBack, 
  onEventClick,
  onNavigateWeek,
  onCreateEvent 
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentWeek, { locale: ptBR })
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Create hourly time slots from 0 to 23
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

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

  // Group events by date and time
  const eventsByDateTime = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    
    events.forEach(event => {
      if (!event.startTime) return
      
      const eventDate = new Date(event.startTime)
      if (isNaN(eventDate.getTime())) return
      
      const dateKey = format(eventDate, 'yyyy-MM-dd')
      const hours = eventDate.getHours()
      const timeKey = `${dateKey}-${hours}`
      
      if (!map.has(timeKey)) {
        map.set(timeKey, [])
      }
      map.get(timeKey)?.push(event)
    })
    
    return map
  }, [events])

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
        const height = Math.max((duration / 60) * 60, 30) // Minimum 30px height
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
          <h2 className="text-xl font-semibold">
            {format(weekStart, 'd', { locale: ptBR })} - {format(weekEnd, 'd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigateWeek('prev')}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigateWeek('next')}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Days header */}
        <div className="flex border-b bg-gray-50">
          <div className="w-20 flex-shrink-0 border-r" /> {/* Empty corner cell */}
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={format(day, 'yyyy-MM-dd')} className={cn(
                "flex-1 min-w-[120px] border-r last:border-r-0 px-2 py-1 text-center",
                isToday && "bg-blue-50"
              )}>
                <div className="text-xs text-gray-500">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  isToday && "text-blue-600"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r overflow-y-auto">
            {timeSlots.map(hour => (
              <div key={hour} className="h-[60px] border-b text-xs text-gray-500 px-2 py-1">
                {format(addHours(startOfDay(new Date()), hour), 'HH:mm')}
              </div>
            ))}
          </div>

          {/* Days columns with unified scroll */}
          <div className="flex-1 flex overflow-y-auto overflow-x-auto">
            {weekDays.map((day, dayIndex) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const allDayEvents = eventsByDateTime.get(`${dateKey}-allday`) || []

              return (
                <div key={dateKey} className="flex-1 min-w-[120px] border-r last:border-r-0">
                  {/* All day events */}
                  {allDayEvents.length > 0 && (
                    <div className="sticky top-0 left-0 right-0 bg-gray-50 border-b p-1 z-10">
                      {allDayEvents.map(event => (
                        <div key={event.id} className="mb-1">
                          <CalendarEventCard
                            event={event}
                            onClick={() => onEventClick(event)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hourly grid */}
                  <div className="relative">
                    {timeSlots.map(hour => (
                      <div
                        key={hour}
                        className="h-[60px] border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          // Create event at this time
                          onCreateEvent()
                        }}
                      />
                    ))}

                    {/* Timed events */}
                    {(() => {
                      const dayEvents = events.filter(event => {
                        if (!event.startTime) return false
                        const eventDate = new Date(event.startTime)
                        if (isNaN(eventDate.getTime())) return false
                        return format(eventDate, 'yyyy-MM-dd') === dateKey
                      })
                      
                      const groups = getEventGroups(dayEvents)
                      
                      return groups.map((group, groupIndex) => {
                        const groupWidth = 100 / group.length
                        
                        return group.map((event, eventIndex) => {
                          const position = getEventPosition(event)
                          const left = eventIndex * groupWidth
                          
                          return (
                            <div
                              key={event.id}
                              className="absolute z-20"
                              style={{
                                top: `${position.top}px`,
                                height: `${position.height}px`,
                                left: `${left}%`,
                                width: `${groupWidth}%`,
                                paddingRight: eventIndex < group.length - 1 ? '1px' : '0',
                                paddingLeft: eventIndex > 0 ? '1px' : '0'
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
                      })
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}