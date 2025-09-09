import { api } from '.';

export interface CalendarEvent {
  id: string;
  customerId: string | null;
  customer: {
    name: string;
    phoneNumber: string;
  } | null;
  title: string;
  description: string;
  startTime: string; // ISO date string from API
  endTime: string; // ISO date string from API
  googleCalendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarWithEvents {
  calendarId: string;
  membershipId: string;
  user: {
    name: string;
  };
  clinic: {
    id: string;
    name: string;
    shortName: string;
  };
  googleCalendarId: string | null;
  isGoogleConnected?: boolean;
  calendarEvents: CalendarEvent[];
  createdAt: string;
  updatedAt: string;
}

interface CalendarResponse {
  calendar: CalendarWithEvents;
}

export const getCalendarByMembershipId = async (membershipId: string): Promise<CalendarWithEvents | null> => {
  try {
    console.log(`Buscando calendário para membership ID: ${membershipId}`);
    const response = await api.get<CalendarResponse>(`/memberships/${membershipId}/calendars`);
    console.log('Calendário recebido:', response.data);
    return response.data.calendar;
  } catch (error) {
    if ((error as any).response?.status === 404) {
      console.log('Calendário não encontrado para este membership');
      return null;
    }
    console.error('Erro ao buscar calendário:', error);
    throw error;
  }
};

export interface WorkingHours {
  weekday: number; // 0-6 (domingo a sábado)
  startTime: string;
  endTime: string;
}

export interface CreateCalendarDto {
  googleCalendarId?: string;
  workingHours: WorkingHours[];
}

export const createCalendar = async (membershipId: string, data?: Partial<CreateCalendarDto>): Promise<CalendarWithEvents> => {
  try {
    console.log(`Criando calendário para membership ID: ${membershipId}`);
    
    // Horário padrão: Segunda a Sexta, 9h às 18h
    const defaultWorkingHours: WorkingHours[] = [
      { weekday: 1, startTime: '09:00', endTime: '18:00' }, // Segunda
      { weekday: 2, startTime: '09:00', endTime: '18:00' }, // Terça
      { weekday: 3, startTime: '09:00', endTime: '18:00' }, // Quarta
      { weekday: 4, startTime: '09:00', endTime: '18:00' }, // Quinta
      { weekday: 5, startTime: '09:00', endTime: '18:00' }, // Sexta
    ];
    
    const requestData: CreateCalendarDto = {
      googleCalendarId: data?.googleCalendarId,
      workingHours: data?.workingHours || defaultWorkingHours
    };
    
    const response = await api.post<CalendarResponse>(`/memberships/${membershipId}/calendars`, requestData);
    console.log('Calendário criado:', response.data);
    return response.data.calendar;
  } catch (error) {
    console.error('Erro ao criar calendário:', error);
    console.error('Detalhes do erro:', (error as any).response?.data);
    throw error;
  }
};

export const getGoogleAuthUrl = async (calendarId: string): Promise<string> => {
  try {
    const response = await api.get<{ authUrl: string }>(`/calendars/${calendarId}/google/auth`);
    return response.data.authUrl;
  } catch (error) {
    console.error('Erro ao obter URL de autorização:', error);
    throw error;
  }
};

export const disconnectGoogleCalendar = async (calendarId: string): Promise<void> => {
  try {
    await api.delete(`/calendars/${calendarId}/google/disconnect`);
  } catch (error) {
    console.error('Erro ao desconectar Google Calendar:', error);
    throw error;
  }
};

// CRUD de Eventos do Calendário
export interface CreateCalendarEventDto {
  customerId?: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  googleCalendarEventId?: string;
}

export interface UpdateCalendarEventDto {
  customerId?: string;
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  googleCalendarEventId?: string;
}

export const createCalendarEvent = async (
  calendarId: string,
  data: CreateCalendarEventDto
): Promise<CalendarEvent> => {
  try {
    console.log(`Criando evento no calendário ${calendarId}:`, data);
    
    // Converter Dates para ISO strings para o backend
    const payload = {
      ...data,
      startTime: data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime,
      endTime: data.endTime instanceof Date ? data.endTime.toISOString() : data.endTime
    };
    
    console.log('Payload sendo enviado:', payload);
    
    const response = await api.post<{ calendarEvent: CalendarEvent }>(
      `/calendars/${calendarId}/calendar-events`,
      payload
    );
    console.log('Evento criado:', response.data);
    return response.data.calendarEvent;
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    console.error('Detalhes do erro:', (error as any).response?.data);
    throw error;
  }
};

export const updateCalendarEvent = async (
  calendarId: string,
  eventId: string,
  data: UpdateCalendarEventDto
): Promise<CalendarEvent> => {
  try {
    console.log(`Atualizando evento ${eventId} no calendário ${calendarId}:`, data);
    
    // Converter Dates para ISO strings para o backend
    const payload = {
      ...data,
      startTime: data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime,
      endTime: data.endTime instanceof Date ? data.endTime.toISOString() : data.endTime
    };
    
    const response = await api.put<{ calendarEvent: CalendarEvent }>(
      `/calendars/${calendarId}/calendar-events/${eventId}`,
      payload
    );
    console.log('Evento atualizado:', response.data);
    return response.data.calendarEvent;
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    console.error('Detalhes do erro:', (error as any).response?.data);
    throw error;
  }
};

export const deleteCalendarEvent = async (
  calendarId: string,
  eventId: string
): Promise<void> => {
  try {
    console.log(`Deletando evento ${eventId} do calendário ${calendarId}`);
    await api.delete(`/calendars/${calendarId}/calendar-events/${eventId}`);
    console.log('Evento deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    throw error;
  }
};

export const syncGoogleCalendarEvents = async (
  calendarId: string
): Promise<{ syncedCount: number; createdCount: number; updatedCount: number }> => {
  try {
    console.log(`Sincronizando eventos do Google Calendar para calendário ${calendarId}`);
    const response = await api.post<{
      message: string;
      syncedCount: number;
      createdCount: number;
      updatedCount: number;
    }>(`/calendars/${calendarId}/sync-google`);
    
    console.log('Sincronização concluída:', response.data);
    return {
      syncedCount: response.data.syncedCount,
      createdCount: response.data.createdCount,
      updatedCount: response.data.updatedCount,
    };
  } catch (error) {
    console.error('Erro ao sincronizar eventos do Google Calendar:', error);
    throw error;
  }
};