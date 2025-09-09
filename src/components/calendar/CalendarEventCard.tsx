import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarEvent } from '@/services/calendar'

interface CalendarEventCardProps {
  event: CalendarEvent
  onClick: () => void
  onDragStart?: (event: CalendarEvent) => void
  isDragging?: boolean
  showTime?: boolean
}

export function CalendarEventCard({ 
  event, 
  onClick, 
  onDragStart,
  isDragging = false,
  showTime = false 
}: CalendarEventCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      e.dataTransfer.effectAllowed = 'move'
      onDragStart(event)
    }
  }

  return (
    <div
      className={cn(
        "group flex flex-col gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-all border w-full h-full min-w-0 overflow-hidden",
        "bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-200",
        isDragging && "opacity-50",
        "select-none"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      draggable
      onDragStart={handleDragStart}
    >
      {showTime && event.startTime && (
        <div className="font-semibold">
          {format(new Date(event.startTime), 'HH:mm')}
        </div>
      )}
      <div className="font-medium truncate flex-1">
        {event.title}
      </div>
      {event.customer && (
        <div className="text-[10px] opacity-75 truncate">
          {event.customer.name}
        </div>
      )}
    </div>
  )
}