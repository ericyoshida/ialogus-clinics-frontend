import { CalendarSidebar } from '@/components/calendar/CalendarSidebar'
import { CalendarView } from '@/components/calendar/CalendarView'
import { CreateEventModal } from '@/components/calendar/CreateEventModal'
import { EmptyCalendarState } from '@/components/calendar/EmptyCalendarState'
import { Button } from '@/components/ui/button'
import { useCalendar } from '@/hooks/use-calendar'
import { useToast } from '@/hooks/use-toast'
import { useUserRole } from '@/hooks/useUserRole'
import { calendarService } from '@/services'
import { CalendarEvent, CalendarWithUser, listCalendarsByClinicId, getCalendarByMembershipId, CalendarWithEvents } from '@/services/calendar'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Loader2, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function CalendarsPage() {
  const { clinicId } = useParams<{ clinicId: string }>()
  const navigate = useNavigate()
  const { calendar: ownCalendar, isLoading: isLoadingOwnCalendar, error: ownCalendarError, hasCalendar: hasOwnCalendar, createCalendar, refetchCalendar } = useCalendar()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Role-based permissions
  const { canViewAllCalendars, hasOwnCalendar: roleHasOwnCalendar, isSecretaria } = useUserRole()

  // State for selected calendar (for ADMIN/SECRETARIA)
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null)
  const [selectedCalendarData, setSelectedCalendarData] = useState<CalendarWithEvents | null>(null)

  // Query to list all calendars for ADMIN/SECRETARIA
  const {
    data: allCalendars = [],
    isLoading: isLoadingAllCalendars,
  } = useQuery({
    queryKey: ['clinic-calendars', clinicId],
    queryFn: () => listCalendarsByClinicId(clinicId!),
    enabled: !!clinicId && canViewAllCalendars,
    staleTime: 5 * 60 * 1000,
  })

  // Query to fetch selected calendar's full data (with events)
  const {
    data: fetchedCalendarData,
    isLoading: isLoadingSelectedCalendar,
    refetch: refetchSelectedCalendar,
  } = useQuery({
    queryKey: ['calendar-by-membership', selectedCalendarId],
    queryFn: async () => {
      // Find the membership ID for this calendar
      const calendar = allCalendars.find(c => c.calendarId === selectedCalendarId)
      if (!calendar?.membershipId) return null
      return getCalendarByMembershipId(calendar.membershipId)
    },
    enabled: !!selectedCalendarId && canViewAllCalendars && allCalendars.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  // Update selected calendar data when fetched
  useEffect(() => {
    if (fetchedCalendarData) {
      setSelectedCalendarData(fetchedCalendarData)
    }
  }, [fetchedCalendarData])

  // Auto-select first calendar or own calendar when data loads
  useEffect(() => {
    if (canViewAllCalendars && allCalendars.length > 0 && !selectedCalendarId) {
      // If SECRETARIA (no own calendar), select first calendar
      // If ADMIN, select own calendar if available, otherwise first
      if (isSecretaria) {
        setSelectedCalendarId(allCalendars[0].calendarId)
      } else if (ownCalendar?.calendarId) {
        setSelectedCalendarId(ownCalendar.calendarId)
        setSelectedCalendarData(ownCalendar)
      } else {
        setSelectedCalendarId(allCalendars[0].calendarId)
      }
    }
  }, [canViewAllCalendars, allCalendars, selectedCalendarId, isSecretaria, ownCalendar])

  // Determine which calendar to display
  const displayCalendar = canViewAllCalendars
    ? (selectedCalendarId === ownCalendar?.calendarId ? ownCalendar : selectedCalendarData)
    : ownCalendar

  const isLoading = canViewAllCalendars
    ? (isLoadingAllCalendars || (selectedCalendarId && isLoadingSelectedCalendar))
    : isLoadingOwnCalendar

  const error = canViewAllCalendars ? null : ownCalendarError
  const hasCalendar = canViewAllCalendars
    ? allCalendars.length > 0
    : hasOwnCalendar

  // Alias for compatibility with existing code
  const calendar = displayCalendar

  // Handler for calendar selection
  const handleCalendarSelect = (calendarId: string) => {
    setSelectedCalendarId(calendarId)
    // If selecting own calendar, use ownCalendar data
    if (calendarId === ownCalendar?.calendarId) {
      setSelectedCalendarData(ownCalendar)
    }
  }

  // Refetch handler that works with selected calendar
  const handleRefetchCalendar = async () => {
    if (canViewAllCalendars && selectedCalendarId !== ownCalendar?.calendarId) {
      await refetchSelectedCalendar()
    } else {
      await refetchCalendar()
    }
  }

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
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
      }

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
          startTime: new Date(updatedEvent.startTime),
          endTime: new Date(updatedEvent.endTime),
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
  }

  const handleEditWorkingHours = () => {
    navigate(`/dashboard/clinic/${clinicId}/calendar/edit`)
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
    return (
      <EmptyCalendarState
        canCreateCalendar={roleHasOwnCalendar}
        isViewingOthersCalendars={canViewAllCalendars}
      />
    )
  }

  // Calendar view
  return (
    <div className="h-full flex flex-col -mt-4 -mx-2 sm:-mx-3 lg:-mx-4">
      {/* Main content area */}
      <div className="flex-1 flex">
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
              await handleRefetchCalendar()
              toast({
                title: 'Calendário atualizado',
                description: 'Os dados do calendário foram atualizados.',
              })
            }}
            // Props for calendar selection (ADMIN/SECRETARIA)
            showCalendarSelector={canViewAllCalendars}
            calendars={allCalendars}
            selectedCalendarId={selectedCalendarId}
            onCalendarSelect={handleCalendarSelect}
            isLoadingCalendars={isLoadingAllCalendars}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <CalendarView
              events={events}
              onEventCreate={handleEventCreate}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar with Edit Working Hours button */}
      <div className="border-t bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            {calendar?.workingHours && calendar.workingHours.length > 0
              ? `${calendar.workingHours.length} período(s) de trabalho configurado(s)`
              : 'Nenhum horário de trabalho configurado'}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditWorkingHours}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Editar Horários de Trabalho
        </Button>
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
