import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type Channel = 'whatsapp' | 'instagram' | 'sms' | 'email';

export type ConversationItem = {
  id: string;
  avatarUrl: string;
  contactName: string;
  clinicName: string;
  lastMessageAt: Date;
  unreadCount: number;
  channel: Channel;
  statusColors: string[]; // ex. ['#00B212', '#FFAA00', '#C4C4C4']
  selected?: boolean;
  lastMessage?: string;
  messages?: Message[];
  phoneNumber?: string;
  tags?: string[];
  isAgentActive?: boolean;
  // WhatsApp Service Window properties
  hasActiveWhatsappServiceWindow?: boolean;
  whatsappServiceWindowExpiresAt?: string | null;
  nextAppointment?: {
    title: string;
    day: string;
    date: string;
    time: string;
  };
  interactionStats?: {
    daysOpen: number;
    daysWithoutInteraction: number;
    interactions: number;
    chartData: number[];
  };
};

export type Message = {
  id: string;
  text: string;
  timestamp: Date;
  isOutgoing: boolean;
  // Media information for rich message display
  mediaType?: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaFilename?: string;
  mediaOriginalFilename?: string;
  mediaMimeType?: string;
  mediaUrl?: string;
};

// Helper to format dates in a readable way with error handling
export const formatMessageTime = (date: Date): string => {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Agora';
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch (error) {
    console.error('Error formatting message time:', error);
    return 'Agora';
  }
};

// Create mock conversations
export const mockConversations: ConversationItem[] = [
  {
    id: '1',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    contactName: 'João Silva',
    clinicName: 'TechSoft',
    lastMessageAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
    unreadCount: 3,
    channel: 'whatsapp',
    statusColors: ['#00B212', '#FFAA00', '#C4C4C4'],
    selected: true,
    lastMessage: 'Bom dia! Gostaria de saber mais sobre o produto.',
    phoneNumber: '+55 11 98765-4321',
    isAgentActive: true,
    tags: ['Preço', 'Urgente', 'Data de Entrega'],
    nextAppointment: {
      title: 'Reunião | Proposta Comercial',
      day: '6',
      date: 'mar/25',
      time: '07:00-08:00',
    },
    interactionStats: {
      daysOpen: 12,
      daysWithoutInteraction: 2,
      interactions: 18,
      chartData: [70, 20, 10],
    },
    messages: [
      {
        id: 'm1',
        text: 'Olá, gostaria de obter informações sobre os produtos.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: 'Bom dia! Como posso ajudar você hoje?',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm3',
        text: 'Estou interessado no modelo X1000. Vocês têm em estoque?',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm4',
        text: 'Sim, temos disponibilidade! O preço atual é R$ 1.250,00 com 10% de desconto para pagamento à vista.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm5',
        text: 'Excelente! E qual o prazo de entrega?',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm6',
        text: 'Para a sua região, a entrega é realizada em até 3 dias úteis.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm7',
        text: 'Bom dia! Gostaria de saber mais sobre o produto.',
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        isOutgoing: false,
      },
    ],
  },
  {
    id: '2',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    contactName: 'Maria Oliveira',
    clinicName: 'SuperMarket',
    lastMessageAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    unreadCount: 0,
    channel: 'instagram',
    statusColors: ['#00B212', '#C4C4C4', '#C4C4C4'],
    lastMessage: 'Obrigada pelo atendimento!',
    phoneNumber: '+55 21 99876-5432',
    tags: ['Atendimento', 'Suporte'],
    messages: [
      {
        id: 'm1',
        text: 'Boa tarde, preciso resolver um problema com meu pedido.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: 'Olá Maria, qual o número do seu pedido?',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm3',
        text: 'É o #54321',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm4',
        text: 'Encontrei aqui. Vejo que houve um atraso na entrega. Já estamos resolvendo!',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm5',
        text: 'Obrigada pelo atendimento!',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        isOutgoing: false,
      },
    ],
  },
  {
    id: '3',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    contactName: 'Carlos Pereira',
    clinicName: 'Construtech',
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 5,
    channel: 'whatsapp',
    statusColors: ['#FFAA00', '#FFAA00', '#C4C4C4'],
    lastMessage: 'Preciso de um orçamento urgente',
    phoneNumber: '+55 31 98765-4321',
    tags: ['Orçamento', 'Urgente'],
    messages: [
      {
        id: 'm1',
        text: 'Bom dia, preciso de um orçamento para reforma.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: 'Olá Carlos! Para qual tipo de projeto você precisa do orçamento?',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm3',
        text: 'Reforma de escritório, aproximadamente 100m²',
        timestamp: new Date(Date.now() - 2.2 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm4',
        text: 'Preciso de um orçamento urgente',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isOutgoing: false,
      },
    ],
  },
  {
    id: '4',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    contactName: 'Ana Santos',
    clinicName: 'BeautyShop',
    lastMessageAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    unreadCount: 0,
    channel: 'sms',
    statusColors: ['#00B212', '#C4C4C4', '#C4C4C4'],
    lastMessage: 'O produto chegou, adorei!',
    phoneNumber: '+55 41 99876-5432',
    tags: ['Feedback', 'Produto'],
    messages: [
      {
        id: 'm1',
        text: 'Olá, meu pedido já foi enviado?',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: 'Olá Ana! Sim, seu pedido foi enviado ontem. O código de rastreio é BR123456789',
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm3',
        text: 'O produto chegou, adorei!',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
    ],
  },
  {
    id: '5',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    contactName: 'Pedro Almeida',
    clinicName: 'TechCorp',
    lastMessageAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    unreadCount: 2,
    channel: 'email',
    statusColors: ['#C4C4C4', '#FFAA00', '#FFAA00'],
    lastMessage: 'Tem alguma novidade sobre o lançamento?',
    phoneNumber: '+55 51 98765-4321',
    tags: ['Produto', 'Lançamento'],
    messages: [
      {
        id: 'm1',
        text: 'Bom dia, gostaria de saber quando será o próximo lançamento de produtos.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: 'Olá Pedro! Estamos planejando um evento de lançamento para o próximo mês. Assim que tivermos a data confirmada, enviaremos um convite.',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm3',
        text: 'Tem alguma novidade sobre o lançamento?',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
    ],
  },
  {
    id: '6',
    avatarUrl: 'https://i.pravatar.cc/150?img=6',
    contactName: 'Fernanda Lima',
    clinicName: 'FashionStyle',
    lastMessageAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    unreadCount: 0,
    channel: 'instagram',
    statusColors: ['#00B212', '#00B212', '#C4C4C4'],
    lastMessage: 'Obrigada pela ajuda com a devolução.',
    phoneNumber: '+55 11 99876-5432',
    tags: ['Devolução', 'Atendimento'],
    messages: [
      {
        id: 'm1',
        text: 'Preciso fazer a devolução de um produto',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: 'Olá Fernanda, claro! Para iniciar o processo de devolução, preciso do número do seu pedido.',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm3',
        text: 'O número é #98765',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm4',
        text: 'Perfeito. Acabei de gerar o código de devolução. Por favor, use este código: DEV12345 ao enviar o produto de volta.',
        timestamp: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm5',
        text: 'Obrigada pela ajuda com a devolução.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
    ],
  },
  {
    id: '7',
    avatarUrl: 'https://i.pravatar.cc/150?img=7',
    contactName: 'Roberto Gomes',
    clinicName: 'InvestBank',
    lastMessageAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    unreadCount: 1,
    channel: 'whatsapp',
    statusColors: ['#FFAA00', '#C4C4C4', '#C4C4C4'],
    lastMessage: 'Quando podemos agendar uma reunião?',
    phoneNumber: '+55 21 98765-4321',
    tags: ['Reunião', 'Investimento'],
    messages: [
      {
        id: 'm1',
        text: 'Bom dia, gostaria de saber mais sobre opções de investimento',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: 'Olá Roberto! Temos várias opções que podem se adequar ao seu perfil. Prefere uma explicação por aqui ou podemos agendar uma reunião?',
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm3',
        text: 'Prefiro agendar uma reunião para discutir com mais detalhes',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm4',
        text: 'Quando podemos agendar uma reunião?',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
    ],
  },
  {
    id: '8',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    contactName: 'Juliana Costa',
    clinicName: 'HealthCare',
    lastMessageAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    unreadCount: 0,
    channel: 'whatsapp',
    statusColors: ['#00B212', '#00B212', '#00B212'],
    lastMessage: 'Obrigada por reagendar minha consulta.',
    phoneNumber: '+55 31 99876-5432',
    tags: ['Consulta', 'Agendamento'],
    messages: [
      {
        id: 'm1',
        text: 'Preciso remarcar minha consulta de amanhã',
        timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: 'Olá Juliana! Claro, vamos verificar as datas disponíveis. Você prefere de manhã ou à tarde?',
        timestamp: new Date(Date.now() - 15.5 * 24 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm3',
        text: 'De manhã seria melhor para mim',
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm4',
        text: 'Temos um horário disponível na próxima terça-feira às 10h. Serve para você?',
        timestamp: new Date(Date.now() - 14.5 * 24 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm5',
        text: 'Perfeito, pode agendar!',
        timestamp: new Date(Date.now() - 14.2 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
      {
        id: 'm6',
        text: 'Pronto! Sua consulta está remarcada para terça-feira às 10h. Enviamos um lembrete no dia anterior.',
        timestamp: new Date(Date.now() - 14.1 * 24 * 60 * 60 * 1000),
        isOutgoing: true,
      },
      {
        id: 'm7',
        text: 'Obrigada por reagendar minha consulta.',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        isOutgoing: false,
      },
    ],
  },
]; 