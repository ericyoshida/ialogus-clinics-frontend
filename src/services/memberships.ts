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

export const getMembershipsByCompanyId = async (companyId: string): Promise<Membership[]> => {
  try {
    console.log(`Buscando memberships para empresa ID: ${companyId}`);
    const response = await api.get<MembershipsResponse>(`/seller-companies/${companyId}/memberships`);
    console.log('Memberships recebidas:', response.data);
    return response.data.memberships;
  } catch (error) {
    console.error('Erro ao buscar memberships:', error);
    throw error;
  }
};