import { useState, useMemo, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarEvent } from '@/services/calendar'
import { CalendarEventCard } from './CalendarEventCard'
import { CalendarDayView } from './CalendarDayView'
import { CalendarWeekView } from './CalendarWeekView'
import { CalendarMobileView } from './CalendarMobileView'
import { CreateEventModal } from './CreateEventModal'
import { EditEventModal } from './EditEventModal'
import { EventDetailsModal } from './EventDetailsModal'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventCreate: (event: Omit<CalendarEvent, 'id'>) => void
  onEventUpdate: (event: CalendarEvent) => void
  onEventDelete: (eventId: string) => void
}

export function CalendarView({ events, onEventCreate, onEventUpdate, onEventDelete }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: ptBR })
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR })

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [calendarStart, calendarEnd])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach(event => {
      if (!event.startTime) return
      
      const startDate = new Date(event.startTime)
      if (isNaN(startDate.getTime())) return
      
      const dateKey = format(startDate, 'yyyy-MM-dd')
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)?.push(event)
    })
    return map
  }, [events])

  const { draggedItem, handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useDragAndDrop<CalendarEvent>({
    onDrop: (event, targetDate) => {
      if (targetDate) {
        const startDate = new Date(event.startTime)
        const endDate = new Date(event.endTime)
        const duration = endDate.getTime() - startDate.getTime()
        
        const newStartDate = new Date(targetDate)
        newStartDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0)
        
        const newEndDate = new Date(newStartDate.getTime() + duration)
        
        onEventUpdate({
          ...event,
          startTime: newStartDate.toISOString(),
          endTime: newEndDate.toISOString()
        })
      }
    }
  })

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setViewMode('day')
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEditModal(true)
  }

  const handleCreateEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    onEventCreate(eventData)
    setShowCreateModal(false)
  }

  if (viewMode === 'week') {
    return (
      <>
        <CalendarWeekView
          currentWeek={currentDate}
          events={events}
          onBack={() => setViewMode('month')}
          onEventClick={handleEventClick}
          onNavigateWeek={(direction) => navigateWeek(direction)}
          onCreateEvent={() => setShowCreateModal(true)}
        />
        <CreateEventModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSubmit={handleCreateEvent}
          defaultDate={selectedDate || currentDate}
        />
        <EditEventModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSubmit={onEventUpdate}
          onDelete={onEventDelete}
          event={selectedEvent}
        />
      </>
    )
  }

  if (viewMode === 'day' && selectedDate) {
    return (
      <>
        <CalendarDayView
          date={selectedDate}
          events={eventsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []}
          onBack={() => setViewMode('month')}
          onEventClick={handleEventClick}
          onCreateEvent={() => setShowCreateModal(true)}
        />
        <CreateEventModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSubmit={handleCreateEvent}
          defaultDate={selectedDate || currentDate}
        />
        <EditEventModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSubmit={onEventUpdate}
          onDelete={onEventDelete}
          event={selectedEvent}
        />
      </>
    )
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Calendar Content */}
        <div className="flex-1 overflow-auto p-4">
          <CalendarMobileView
            events={events}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onCreateEvent={() => setShowCreateModal(true)}
          />
        </div>

        {/* Modals */}
        <CreateEventModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSubmit={handleCreateEvent}
          defaultDate={selectedDate || currentDate}
        />

        <EditEventModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSubmit={onEventUpdate}
          onDelete={onEventDelete}
          event={selectedEvent}
        />
      </div>
    )
  }

  // Desktop view
  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoje
          </Button>
        </div>
        
        {/* View Mode Selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
            className="h-7 px-3"
          >
            Mês
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
            className="h-7 px-3"
          >
            Semana
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('day')}
            className="h-7 px-3"
          >
            Dia
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7" style={{ minHeight: '100%' }}>
            {calendarDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDate.get(dateKey) || []
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] border-r border-b cursor-pointer hover:bg-gray-50 transition-colors",
                    !isCurrentMonth && "bg-gray-50",
                    isToday && "bg-blue-50"
                  )}
                  onClick={() => handleDayClick(day)}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div className="h-full p-2 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          !isCurrentMonth && "text-gray-400",
                          isToday && "text-blue-600"
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div key={event.id} className="min-w-0">
                          <CalendarEventCard
                            event={event}
                            onClick={() => handleEventClick(event)}
                            onDragStart={handleDragStart}
                            isDragging={draggedItem?.id === event.id}
                          />
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 hover:text-gray-700">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateEvent}
        defaultDate={selectedDate || currentDate}
      />

      <EditEventModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSubmit={onEventUpdate}
        onDelete={onEventDelete}
        event={selectedEvent}
      />
    </div>
  )
}