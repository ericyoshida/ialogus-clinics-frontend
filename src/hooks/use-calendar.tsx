import { useAuth } from '@/contexts/AuthContext';
import { calendarService, membershipsService } from '@/services';
import { Membership } from '@/services/memberships';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export function useCalendar() {
  const { user } = useAuth();
  const { clinicId } = useParams<{ clinicId: string }>();

  // Buscar memberships da clínica
  const {
    data: memberships,
    isLoading: isLoadingMemberships,
    error: membershipsError
  } = useQuery({
    queryKey: ['memberships', clinicId],
    queryFn: () => membershipsService.getMembershipsByClinicId(clinicId!),
    enabled: !!clinicId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Encontrar o membership do usuário atual
  const currentUserMembership = memberships?.find(
    (membership: Membership) => membership.userId === user?.id
  );

  // Buscar calendário do membership
  const {
    data: calendar,
    isLoading: isLoadingCalendar,
    error: calendarError,
    refetch: refetchCalendar
  } = useQuery({
    queryKey: ['calendar', currentUserMembership?.membershipId],
    queryFn: () => calendarService.getCalendarByMembershipId(currentUserMembership!.membershipId),
    enabled: !!currentUserMembership?.membershipId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Função para criar calendário
  const createCalendar = async (data?: Parameters<typeof calendarService.createCalendar>[1]) => {
    if (!currentUserMembership?.membershipId) {
      throw new Error('Membership ID não encontrado');
    }

    try {
      const newCalendar = await calendarService.createCalendar(currentUserMembership.membershipId, data);
      // Refetch para atualizar os dados
      await refetchCalendar();
      return newCalendar;
    } catch (error) {
      console.error('Erro ao criar calendário:', error);
      throw error;
    }
  };

  return {
    calendar,
    isLoading: isLoadingMemberships || isLoadingCalendar,
    error: membershipsError || calendarError,
    hasCalendar: !!calendar,
    membershipId: currentUserMembership?.membershipId,
    createCalendar,
    refetchCalendar
  };
}