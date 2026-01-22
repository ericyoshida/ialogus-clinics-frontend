import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useClinic } from '@/contexts/ClinicContext'

export type UserRole = 'ADMIN' | 'DENTISTA' | 'SECRETARIA'

export interface RolePermissions {
  canManageMembers: boolean      // Adicionar/editar/remover membros
  canViewChannels: boolean       // Ver página Canais
  canViewAgents: boolean         // Ver página Agentes
  canViewAllCalendars: boolean   // Ver todos os calendários da clínica
  hasOwnCalendar: boolean        // Possui calendário próprio
  canEditAnyCalendar: boolean    // Editar calendário de outros
  currentRole: UserRole | null
  isAdmin: boolean
  isDentista: boolean
  isSecretaria: boolean
}

export function useUserRole(): RolePermissions {
  const { user } = useAuth()
  const { selectedClinic } = useClinic()

  return useMemo(() => {
    // As roles vêm diretamente da clínica selecionada (que agora inclui userRoles)
    const roles = selectedClinic?.userRoles ?? []
    const role = roles[0] as UserRole | undefined

    const isAdmin = role === 'ADMIN'
    const isDentista = role === 'DENTISTA'
    const isSecretaria = role === 'SECRETARIA'

    return {
      canManageMembers: isAdmin,
      canViewChannels: isAdmin,
      canViewAgents: isAdmin,
      canViewAllCalendars: isAdmin || isSecretaria,
      hasOwnCalendar: isAdmin || isDentista,
      canEditAnyCalendar: isAdmin || isSecretaria,
      currentRole: role || null,
      isAdmin,
      isDentista,
      isSecretaria,
    }
  }, [user, selectedClinic])
}
