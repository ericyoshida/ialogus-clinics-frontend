import { api } from '.';

export interface Membership {
  membershipId: string;
  clinicId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface MembershipsResponse {
  memberships: Membership[];
}

export const getMembershipsByClinicId = async (clinicId: string): Promise<Membership[]> => {
  try {
    console.log(`Buscando memberships para clínica ID: ${clinicId}`);
    const response = await api.get<MembershipsResponse>(`/clinics/${clinicId}/memberships`);
    console.log('Memberships recebidas:', response.data);
    return response.data.memberships;
  } catch (error) {
    console.error('Erro ao buscar memberships:', error);
    throw error;
  }
};