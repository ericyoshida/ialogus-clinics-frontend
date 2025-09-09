import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MiniCalendar } from './MiniCalendar'
import { CalendarEvent, syncGoogleCalendarEvents } from '@/services/calendar'
import { GoogleCalendarConnect } from './GoogleCalendarConnect'
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
}

export function CalendarSidebar({ 
  events, 
  selectedDate, 
  onDateSelect, 
  onCreateClick,
  calendarId,
  isGoogleConnected = false,
  onGoogleConnectionChange
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

        {/* Additional calendar options can be added here */}
        <div className="border-t pt-4 space-y-3">
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Meus eventos</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span className="text-sm text-gray-700">Agendamentos</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm text-gray-700">Tarefas</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}