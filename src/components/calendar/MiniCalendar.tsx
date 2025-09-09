import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarEvent } from '@/services/calendar'

interface MiniCalendarProps {
  events: CalendarEvent[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
}

export function MiniCalendar({ events, selectedDate, onDateSelect }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const hasEvents = (date: Date) => {
    return events.some(event => {
      if (!event.startTime) return false
      const eventDate = new Date(event.startTime)
      if (isNaN(eventDate.getTime())) return false
      return eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-xs text-gray-500 text-center py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <button
                onClick={() => onDateSelect(date)}
                className={cn(
                  "w-full h-full text-xs rounded-md relative flex items-center justify-center transition-colors",
                  isToday(date) && "font-semibold",
                  isSelected(date) && "bg-gradient-to-r from-[#1A73E8] to-[#7C3AED] text-white",
                  !isSelected(date) && isToday(date) && "bg-blue-50 text-blue-600",
                  !isSelected(date) && !isToday(date) && "hover:bg-gray-100",
                  "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                )}
              >
                {date.getDate()}
                {hasEvents(date) && !isSelected(date) && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}