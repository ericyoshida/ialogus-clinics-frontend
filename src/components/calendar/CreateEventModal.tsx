import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CalendarEvent } from '@/services/calendar'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  defaultDate?: Date
}

export function CreateEventModal({ open, onOpenChange, onSubmit, defaultDate = new Date() }: CreateEventModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate)
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [formData, setFormData] = useState<Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'startTime' | 'endTime'>>>({
    title: '',
    description: '',
    customerId: null,
    googleCalendarEventId: null,
  })


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && startTime && endTime) {
      // Combinar data selecionada com horários
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      
      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)
      
      const endDateTime = new Date(selectedDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)
      
      onSubmit({
        ...formData,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        customer: null,
      } as Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>)
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      customerId: null,
      googleCalendarEventId: null,
    })
    setSelectedDate(defaultDate)
    setStartTime('')
    setEndTime('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Título do Evento</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título do evento"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite uma descrição"
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date)
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Hora de Início</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="endTime">Hora de Término</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Evento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}