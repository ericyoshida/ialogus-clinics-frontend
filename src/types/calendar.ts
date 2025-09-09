export type CalendarEventType = 'whatsapp' | 'video' | 'meeting' | 'task' | 'appointment'

export type EventVisibility = 'busy' | 'free'

export interface CalendarEvent {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  customerId?: string | null
  customer?: {
    name: string
    phoneNumber: string
  } | null
  googleCalendarEventId?: string | null
  type?: CalendarEventType
  location?: string
  videoLink?: string
  guests?: string[]
  visibility?: EventVisibility
  notifications?: EventNotification[]
  attachments?: EventAttachment[]
  color?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface EventNotification {
  id: string
  type: 'email' | 'popup'
  time: number // minutes before event
}

export interface EventAttachment {
  id: string
  name: string
  url: string
  type: string
}

export interface CreateEventData extends Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> {}