import { useState, useCallback } from 'react'

interface UseDragAndDropOptions<T> {
  onDrop: (item: T, targetDate: Date | null) => void
}

export function useDragAndDrop<T extends { id: string }>({ onDrop }: UseDragAndDropOptions<T>) {
  const [draggedItem, setDraggedItem] = useState<T | null>(null)

  const handleDragStart = useCallback((item: T) => {
    setDraggedItem(item)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, date?: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (draggedItem) {
      onDrop(draggedItem, date)
      setDraggedItem(null)
    }
  }, [draggedItem, onDrop])

  return {
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  }
}