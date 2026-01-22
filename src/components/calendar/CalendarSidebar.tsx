import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MiniCalendar } from './MiniCalendar'
import { CalendarEvent, CalendarWithUser, syncGoogleCalendarEvents } from '@/services/calendar'
import { GoogleCalendarConnect } from './GoogleCalendarConnect'
import { CalendarSelector } from './CalendarSelector'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface CalendarSidebarProps {
  events: CalendarEvent[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onCreateClick: () => void
  calendarId?: string
  isGoogleConnected?: boolean
  onGoogleConnectionChange?: (connected: boolean) => void
  // Props para seleção de calendários (ADMIN/SECRETARIA)
  showCalendarSelector?: boolean
  calendars?: CalendarWithUser[]
  selectedCalendarId?: string | null
  onCalendarSelect?: (calendarId: string) => void
  isLoadingCalendars?: boolean
}

export function CalendarSidebar({
  events,
  selectedDate,
  onDateSelect,
  onCreateClick,
  calendarId,
  isGoogleConnected = false,
  onGoogleConnectionChange,
  showCalendarSelector = false,
  calendars = [],
  selectedCalendarId = null,
  onCalendarSelect,
  isLoadingCalendars = false
}: CalendarSidebarProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const handleSyncGoogleCalendar = async () => {
    if (!calendarId || !isGoogleConnected) return

    setIsSyncing(true)
    try {
      const result = await syncGoogleCalendarEvents(calendarId)
      toast({
        title: 'Sincronização concluída',
        description: `${result.createdCount} eventos criados, ${result.updatedCount} atualizados.`,
      })
      // Trigger calendar refresh
      if (onGoogleConnectionChange) {
        onGoogleConnectionChange(true)
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os eventos do Google Calendar.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="w-64 h-full">
      <div className="space-y-6 p-4">
        {/* Title */}
        <h2 className="text-[21px] font-medium text-gray-900">Calendários</h2>

        {/* Calendar Selector (for ADMIN/SECRETARIA) */}
        {showCalendarSelector && onCalendarSelect && (
          <div className="border-b pb-4">
            <CalendarSelector
              calendars={calendars}
              selectedCalendarId={selectedCalendarId}
              onSelect={onCalendarSelect}
              isLoading={isLoadingCalendars}
            />
          </div>
        )}

        {/* Create button */}
        <button
          onClick={onCreateClick}
          className="w-full py-2.5 px-4 rounded-md text-white font-normal transition-all hover:opacity-90 ialogus-gradient-auth"
        >
          <div className="flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Criar
          </div>
        </button>

        {/* Mini calendar */}
        <div className="border-t pt-6">
          <MiniCalendar 
            events={events}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
          />
        </div>

        {/* Google Calendar Connection */}
        {calendarId && (
          <div className="border-t pt-4 space-y-3">
            <GoogleCalendarConnect
              calendarId={calendarId}
              isConnected={isGoogleConnected}
              onConnectionChange={onGoogleConnectionChange}
            />
            
            {/* Sync Button */}
            {isGoogleConnected && (
              <Button
                onClick={handleSyncGoogleCalendar}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Google Calendar'}
              </Button>
            )}
          </div>
        )}

        {/* Filtros de calendario com checkboxes estilizadas */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Filtros</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-confirmed"
                defaultChecked
                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              />
              <Label
                htmlFor="show-confirmed"
                className="text-sm font-normal cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Confirmados
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-pending"
                defaultChecked
                className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
              />
              <Label
                htmlFor="show-pending"
                className="text-sm font-normal cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Pendentes
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-cancelled"
                defaultChecked
                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <Label
                htmlFor="show-cancelled"
                className="text-sm font-normal cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Cancelados
                </span>
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}