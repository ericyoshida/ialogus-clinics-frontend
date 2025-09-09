import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, Trash2, Edit, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CalendarEvent } from '@/services/calendar'
import { Separator } from '@/components/ui/separator'

interface EventDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (eventId: string) => void
}

export function EventDetailsModal({ 
  open, 
  onOpenChange, 
  event, 
  onEdit, 
  onDelete 
}: EventDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!event) return null

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id)
      onOpenChange(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(event)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{event.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {format(new Date(event.startTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </>
          )}

          {/* Customer */}
          {event.customer && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{event.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{event.customer.phoneNumber}</p>
                </div>
              </div>
            </>
          )}

          {/* Google Calendar ID */}
          {event.googleCalendarEventId && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground">
                Google Calendar ID: {event.googleCalendarEventId}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          {showDeleteConfirm ? (
            <>
              <p className="text-sm text-muted-foreground mr-auto">
                Tem certeza que deseja excluir?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Confirmar
              </Button>
            </>
          ) : (
            <>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}