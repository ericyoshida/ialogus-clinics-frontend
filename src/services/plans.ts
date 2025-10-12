import api from './api';

export type Plan = 'FREE' | 'START' | 'PRO';

export interface PlanInfo {
  name: Plan;
  displayName: string;
  description: string;
  price: string;
  features: string[];
  isPopular?: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    name: 'FREE',
    displayName: 'Gratuito',
    description: 'Ideal para começar',
    price: 'R$ 0',
    features: [
      'Até 100 conversas/mês',
      '1 agente de IA',
      'Suporte básico',
      'Integração WhatsApp'
    ]
  },
  {
    name: 'START',
    displayName: 'Starter',
    description: 'Para pequenas clínicas',
    price: 'R$ 97',
    features: [
      'Até 1.000 conversas/mês',
      '3 agentes de IA',
      'Suporte prioritário',
      'Integração WhatsApp',
      'Relatórios básicos',
      'Calendário integrado'
    ],
    isPopular: true
  },
  {
    name: 'PRO',
    displayName: 'Profissional',
    description: 'Para clínicas em crescimento',
    price: 'R$ 297',
    features: [
      'Conversas ilimitadas',
      'Agentes de IA ilimitados',
      'Suporte 24/7',
      'Todas as integrações',
      'Relatórios avançados',
      'API personalizada',
      'Treinamento personalizado'
    ]
  }
];

export const updateUserPlan = async (plan: Plan): Promise<void> => {
  await api.put('/user/plan', { plan });
};

export const getPlanInfo = (planName: Plan): PlanInfo | undefined => {
  return PLANS.find(plan => plan.name === planName);
};

export const getCurrentPlanInfo = (userPlan?: string): PlanInfo => {
  const plan = userPlan as Plan || 'FREE';
  return getPlanInfo(plan) || PLANS[0];
}; 