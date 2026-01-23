import { useClinics } from './use-clinics';

export type UserRole = 'ADMIN' | 'SECRETARIA' | 'DENTISTA';

// Roles que têm acesso às funcionalidades administrativas (agentes, canais, catálogo)
const ADMIN_ROLES: UserRole[] = ['ADMIN'];

export function useUserRole(clinicId?: string) {
  const { clinics, loading } = useClinics();

  const clinic = clinicId
    ? clinics.find(c => c.id === clinicId)
    : null;

  const userRoles = clinic?.userRoles as UserRole[] | undefined;

  // Verifica se o usuário tem pelo menos uma role administrativa
  const isAdmin = userRoles?.some(role => ADMIN_ROLES.includes(role)) ?? false;

  // Verifica se é secretária
  const isSecretary = userRoles?.includes('SECRETARIA') ?? false;

  // Verifica se é dentista/doutor
  const isDoctor = userRoles?.includes('DENTISTA') ?? false;

  // Determina se o usuário pode acessar funcionalidades administrativas
  // (agentes, canais de comunicação, catálogo de serviços)
  const canAccessAdminFeatures = isAdmin;

  return {
    userRoles,
    isAdmin,
    isSecretary,
    isDoctor,
    canAccessAdminFeatures,
    loading,
  };
}
