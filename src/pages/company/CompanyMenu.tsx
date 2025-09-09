import { FeatureCard } from '@/components/ui/feature-card';
import { useCompanies } from '@/hooks/use-companies';
import {
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    PhoneIcon,
    ShoppingBagIcon,
    UserGroupIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function CompanyMenu() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState({
    name: "Carregando...",
    id: companyId
  });
  
  // Buscar as empresas para encontrar o nome pelo ID
  const { companies, loading } = useCompanies();
  
  // Atualizar o nome da empresa quando as empresas forem carregadas
  useEffect(() => {
    if (!loading && companies.length > 0 && companyId) {
      const foundCompany = companies.find(c => c.id === companyId);
      
      if (foundCompany) {
        setCompany({
          name: foundCompany.name,
          id: companyId
        });
      } else {
        // Se não encontrou a empresa, mas temos o ID
        setCompany({
          name: "Empresa não encontrada",
          id: companyId || ""
        });
      }
    }
  }, [companyId, companies, loading]);

  const menuItems = [
    {
      id: 'agents',
      title: 'Meus Agentes',
      icon: <UserGroupIcon className="w-6 h-6" />,
      gradientColors: { from: '#4F46E5', to: '#8B5CF6' }, // Roxo para agentes
      onClick: () => navigate(`/dashboard/company/${company.id}/agents`)
    },
    {
      id: 'members',
      title: 'Membros da Empresa',
      icon: <UsersIcon className="w-6 h-6" />,
      gradientColors: { from: '#10B981', to: '#059669' }, // Verde para membros
      onClick: () => navigate(`/dashboard/company/${company.id}/members`)
    },
    {
      id: 'catalog',
      title: 'Catálogo de Produtos',
      icon: <ShoppingBagIcon className="w-6 h-6" />,
      gradientColors: { from: '#EB9B45', to: '#E05C5C' }, // Laranja para catálogo
      onClick: () => navigate(`/dashboard/company/${company.id}/catalogs`)
    },
    {
      id: 'channels',
      title: 'Canais de Comunicação',
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      gradientColors: { from: '#3B82F6', to: '#2563EB' }, // Azul para canais
      onClick: () => navigate(`/dashboard/company/${company.id}/channels`)
    },
    {
      id: 'contacts',
      title: 'Contatos',
      icon: <PhoneIcon className="w-6 h-6" />,
      gradientColors: { from: '#F59E0B', to: '#D97706' }, // Âmbar para contatos
      onClick: () => navigate(`/dashboard/company/${company.id}/contacts`)
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <ChartBarIcon className="w-6 h-6" />,
      gradientColors: { from: '#EC4899', to: '#BE185D' }, // Rosa para dashboard
      onClick: () => console.log('Dashboard clicked')
    }
  ];

  // Dividir os itens em duas linhas
  const firstRow = menuItems.slice(0, 3);
  const secondRow = menuItems.slice(3, 6);

  // Estilo com dimensões fixas para os cards
  const cardStyle = {
    width: '280px',
    height: '280px',
    display: 'block',
  };

  // State para armazenar o número de colunas baseado no tamanho da tela
  const [columns, setColumns] = useState(3);

  // Efeito para atualizar o número de colunas quando a tela mudar de tamanho
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumns(1); // Mobile: 1 coluna
      } else if (window.innerWidth < 1024) {
        setColumns(2); // Tablet: 2 colunas
      } else {
        setColumns(3); // Desktop: 3 colunas
      }
    };

    // Inicializar
    handleResize();

    // Adicionar listener
    window.addEventListener('resize', handleResize);
    
    // Limpar listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Construir o estilo do grid baseado no número de colunas
  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 280px)`,
    columnGap: '1.25rem', // Espaçamento lateral reduzido (20px)
    rowGap: '2rem',       // Espaçamento vertical mantido (32px)
    justifyContent: columns === 1 ? 'center' : 'start',
  };

  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com nome da empresa */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-5 pl-1">
        <div className="flex-1 mb-2 sm:mb-0">
          <h1 className="text-[21px] font-medium text-gray-900 mt-2">{company.name}</h1>
          <p className="text-gray-500 text-sm">Menu administrativo</p>
        </div>
      </div>

      {/* Grid de cards responsivo com espaçamento lateral fixo */}
      <div style={gridContainerStyle} className="max-w-full">
        {/* Todos os cards em sequência */}
        {[...firstRow, ...secondRow].map((item) => (
          <div key={item.id}>
            <div style={cardStyle}>
              <FeatureCard
                title={item.title}
                icon={item.icon}
                gradientColors={item.gradientColors}
                decorativeElement="circle"
                onClick={item.onClick}
                className="h-full w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 