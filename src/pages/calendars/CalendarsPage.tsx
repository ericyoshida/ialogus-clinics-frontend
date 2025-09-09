import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarView } from '@/components/calendar/CalendarView'
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar'
import { CreateEventModal } from '@/components/calendar/CreateEventModal'
import { EmptyCalendarState } from '@/components/calendar/EmptyCalendarState'
import { CalendarEvent } from '@/services/calendar'
import { useCalendar } from '@/hooks/use-calendar'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '@/services'

export default function CalendarsPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const { calendar, isLoading, error, hasCalendar, createCalendar, refetchCalendar } = useCalendar()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Adicionar cor aos eventos do calendário e filtrar eventos inválidos
  const events: CalendarEvent[] = calendar?.calendarEvents?.filter(event => {
    // Filtrar eventos com datas inválidas
    if (!event.startTime || !event.endTime) return false
    const startDate = new Date(event.startTime)
    const endDate = new Date(event.endTime)
    return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())
  }).map(event => ({
    ...event,
    color: '#F15A24'
  })) || []

  // Mutations para CRUD de eventos
  const createEventMutation = useMutation({
    mutationFn: (eventData: Omit<CalendarEvent, 'id'>) => {
      if (!calendar?.calendarId) throw new Error('Calendar ID not found')
      const createData: any = {
        title: eventData.title,
        description: eventData.description,
        startTime: new Date(eventData.startTime), // Já é uma string ISO, mas o DTO espera Date
        endTime: new Date(eventData.endTime), // Já é uma string ISO, mas o DTO espera Date
      }
      
      // Adicionar campos opcionais apenas se existirem
      if (eventData.customerId) {
        createData.customerId = eventData.customerId
      }
      if (eventData.googleCalendarEventId) {
        createData.googleCalendarEventId = eventData.googleCalendarEventId
      }
      
      return calendarService.createCalendarEvent(calendar.calendarId, createData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast({
        title: 'Evento criado',
        description: 'O evento foi criado com sucesso.',
      })
    },
    onError: (error) => {
      console.error('Erro ao criar evento:', error)
      toast({
        title: 'Erro ao criar evento',
        description: 'Ocorreu um erro ao criar o evento. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  const updateEventMutation = useMutation({
    mutationFn: (updatedEvent: CalendarEvent) => {
      if (!calendar?.calendarId) throw new Error('Calendar ID not found')
      return calendarService.updateCalendarEvent(
        calendar.calendarId,
        updatedEvent.id,
        {
          title: updatedEvent.title,
          description: updatedEvent.description,
          startTime: new Date(updatedEvent.startTime), // Já é uma string ISO, mas o DTO espera Date
          endTime: new Date(updatedEvent.endTime), // Já é uma string ISO, mas o DTO espera Date
          customerId: updatedEvent.customerId || undefined,
          googleCalendarEventId: updatedEvent.googleCalendarEventId || undefined
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast({
        title: 'Evento atualizado',
        description: 'O evento foi atualizado com sucesso.',
      })
    },
    onError: (error) => {
      console.error('Erro ao atualizar evento:', error)
      toast({
        title: 'Erro ao atualizar evento',
        description: 'Ocorreu um erro ao atualizar o evento. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => {
      if (!calendar?.calendarId) throw new Error('Calendar ID not found')
      return calendarService.deleteCalendarEvent(calendar.calendarId, eventId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast({
        title: 'Evento deletado',
        description: 'O evento foi deletado com sucesso.',
      })
    },
    onError: (error) => {
      console.error('Erro ao deletar evento:', error)
      toast({
        title: 'Erro ao deletar evento',
        description: 'Ocorreu um erro ao deletar o evento. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  const handleEventCreate = (eventData: Omit<CalendarEvent, 'id'>) => {
    createEventMutation.mutate(eventData)
  }

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    updateEventMutation.mutate(updatedEvent)
  }

  const handleEventDelete = (eventId: string) => {
    deleteEventMutation.mutate(eventId)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // You can add logic here to navigate to the selected date in the main calendar
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar calendário</p>
          <p className="text-sm text-muted-foreground">Tente recarregar a página</p>
        </div>
      </div>
    )
  }

  // Empty calendar state
  if (!hasCalendar) {
    return <EmptyCalendarState />
  }

  // Calendar view
  return (
    <div className="h-full flex -mt-4 -mx-2 sm:-mx-3 lg:-mx-4">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <CalendarSidebar
          events={events}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onCreateClick={() => setShowCreateModal(true)}
          calendarId={calendar?.calendarId}
          isGoogleConnected={calendar?.isGoogleConnected}
          onGoogleConnectionChange={async () => {
            // Refresh calendar data when connection changes
            await refetchCalendar()
            toast({
              title: 'Calendário atualizado',
              description: 'Os dados do calendário foram atualizados.',
            })
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="h-full">
          <CalendarView
            events={events}
            onEventCreate={handleEventCreate}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
          />
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={(eventData) => {
          handleEventCreate(eventData)
          setShowCreateModal(false)
        }}
      />
    </div>
  )
} 