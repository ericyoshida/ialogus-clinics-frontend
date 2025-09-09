import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TimeSlot {
  day: number;
  hour: number;
  minute: number;
}

interface WorkingHoursSelectorProps {
  value: Array<{ weekday: number; startTime: string; endTime: string }>;
  onChange: (value: Array<{ weekday: number; startTime: string; endTime: string }>) => void;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WorkingHoursSelector({ value, onChange }: WorkingHoursSelectorProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Converter value para selectedSlots
  useEffect(() => {
    const slots = new Set<string>();
    value.forEach(({ weekday, startTime, endTime }) => {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        slots.add(`${weekday}-${currentHour}-${currentMinute}`);
        
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour++;
        }
      }
    });
    setSelectedSlots(slots);
  }, [value]);

  const getSlotKey = (day: number, hour: number, minute: number) => {
    return `${day}-${hour}-${minute}`;
  };

  const handleMouseDown = (day: number, hour: number, minute: number) => {
    setIsDragging(true);
    const slotKey = getSlotKey(day, hour, minute);
    
    setIsSelecting(!selectedSlots.has(slotKey));
    
    const newSlots = new Set(selectedSlots);
    if (selectedSlots.has(slotKey)) {
      newSlots.delete(slotKey);
    } else {
      newSlots.add(slotKey);
    }
    setSelectedSlots(newSlots);
  };

  const handleMouseEnter = (day: number, hour: number, minute: number) => {
    if (!isDragging) return;
    
    const slotKey = getSlotKey(day, hour, minute);
    const newSlots = new Set(selectedSlots);
    
    if (isSelecting) {
      newSlots.add(slotKey);
    } else {
      newSlots.delete(slotKey);
    }
    
    setSelectedSlots(newSlots);
  };

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Converter selectedSlots para o formato esperado
    const workingHours: Array<{ weekday: number; startTime: string; endTime: string }> = [];
    
    for (let day = 0; day < 7; day++) {
      const daySlots: number[] = [];
      
      selectedSlots.forEach(slot => {
        const [d, h, m] = slot.split('-').map(Number);
        if (d === day) {
          daySlots.push(h * 60 + m);
        }
      });
      
      if (daySlots.length === 0) continue;
      
      daySlots.sort((a, b) => a - b);
      
      // Agrupar slots contínuos
      let start = daySlots[0];
      let end = start;
      
      for (let i = 1; i <= daySlots.length; i++) {
        if (i < daySlots.length && daySlots[i] === end + 30) {
          end = daySlots[i];
        } else {
          const startHour = Math.floor(start / 60);
          const startMinute = start % 60;
          const endHour = Math.floor((end + 30) / 60);
          const endMinute = (end + 30) % 60;
          
          workingHours.push({
            weekday: day,
            startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
            endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          });
          
          if (i < daySlots.length) {
            start = daySlots[i];
            end = start;
          }
        }
      }
    }
    
    onChange(workingHours);
  }, [isDragging, selectedSlots, onChange]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Prevenir seleção de texto durante o drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div className="select-none relative">
      <div className="flex">
        {/* Coluna fixa com dias da semana */}
        <div className="flex-shrink-0 w-20 sm:w-24 bg-white z-10 sticky left-0">
          <div className="h-8 border-b" /> {/* Espaço do header */}
          {DAYS.map((day, dayIndex) => (
            <div 
              key={dayIndex} 
              className="h-10 sm:h-10 flex items-center justify-end pr-1 sm:pr-2 text-xs sm:text-sm font-medium border-b bg-white"
            >
              {day.substring(0, 3)} {/* Abreviado no mobile */}
              <span className="hidden sm:inline">{day.substring(3)}</span>
            </div>
          ))}
        </div>

        {/* Grid de horários com scroll */}
        <div className="overflow-x-auto flex-1">
          <div className="w-full sm:w-full min-w-[800px]">
            {/* Header com horas */}
            <div className="flex h-8 border-b sticky top-0 bg-white z-5">
              {HOURS.map(hour => (
                <div key={hour} className="relative w-[50px] sm:flex-1 flex">
                  <div className="relative w-[25px] sm:flex-1">
                    <span className="absolute left-0 top-1 text-xs text-muted-foreground -translate-x-1/2">
                      {hour}:00
                    </span>
                  </div>
                  <div className="w-[25px] sm:flex-1" />
                </div>
              ))}
            </div>

            {/* Grid de slots */}
            {DAYS.map((_, dayIndex) => (
              <div key={dayIndex} className="flex h-10">
                {HOURS.map(hour => (
                  <div key={hour} className="flex w-[50px] sm:flex-1">
                    {[0, 30].map(minute => {
                      const slotKey = getSlotKey(dayIndex, hour, minute);
                      const isSelected = selectedSlots.has(slotKey);
                      
                      return (
                        <div
                          key={minute}
                          className={cn(
                            'w-[25px] sm:flex-1 h-full cursor-pointer transition-colors relative',
                            'border-r border-b',
                            hour === 0 && minute === 0 ? 'border-l' : '',
                            isSelected 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          )}
                          onMouseDown={() => handleMouseDown(dayIndex, hour, minute)}
                          onMouseEnter={() => handleMouseEnter(dayIndex, hour, minute)}
                          onTouchStart={() => handleMouseDown(dayIndex, hour, minute)}
                          onTouchMove={(e) => {
                            const touch = e.touches[0];
                            const element = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (element && element.classList.contains('cursor-pointer')) {
                              // Trigger mouse enter on the element under touch
                              element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                            }
                          }}
                        >
                          {/* Linha vertical a cada hora */}
                          {minute === 0 && (
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs sm:text-sm text-muted-foreground">
        💡 <span className="sm:hidden">Toque e arraste</span>
        <span className="hidden sm:inline">Clique e arraste</span> para selecionar os horários
      </div>
    </div>
  );
}