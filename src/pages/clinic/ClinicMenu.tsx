import { FeatureCard } from '@/components/ui/feature-card';
import { useClinics } from '@/hooks/use-clinics';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ClinicMenu() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  
  const [clinic, setClinic] = useState({
    name: "Carregando...",
    id: clinicId
  });
  
  // Buscar as clínicas para encontrar o nome pelo ID
  const { clinics, loading } = useClinics();
  
  // Atualizar o nome da clínica quando as clínicas forem carregadas
  useEffect(() => {
    if (!loading && clinics.length > 0 && clinicId) {
      const foundClinic = clinics.find(c => c.id === clinicId);
      
      if (foundClinic) {
        setClinic({
          name: foundClinic.name,
          id: clinicId
        });
      } else {
        // Se não encontrou a clínica, mas temos o ID
        setClinic({
          name: "Clínica não encontrada",
          id: clinicId || ""
        });
      }
    }
  }, [clinicId, clinics, loading]);

  const menuItems: Array<{
    id: string;
    title: string;
    svgPath: string;
    gradientColors: { from: string; to: string };
    onClick: () => void;
  }> = [
    {
      id: 'agents',
      title: 'Meus Agentes',
      svgPath: '/images/agents.svg',
      gradientColors: { from: '#F6921E', to: '#EE413D' },
      onClick: () => navigate(`/dashboard/clinic/${clinic.id}/agents`)
    },
    {
      id: 'members',
      title: 'Membros da Clínica',
      svgPath: '/images/membros.svg',
      gradientColors: { from: '#F6921E', to: '#EE413D' },
      onClick: () => navigate(`/dashboard/clinic/${clinic.id}/members`)
    },
    {
      id: 'catalog',
      title: 'Catálogo de Produtos',
      svgPath: '/images/catalogo.svg',
      gradientColors: { from: '#F6921E', to: '#EE413D' },
      onClick: () => navigate(`/dashboard/clinic/${clinic.id}/catalogs`)
    },
    {
      id: 'channels',
      title: 'Canais de Comunicação',
      svgPath: '/images/canais.svg',
      gradientColors: { from: '#F6921E', to: '#EE413D' },
      onClick: () => navigate(`/dashboard/clinic/${clinic.id}/channels`)
    },
    {
      id: 'contacts',
      title: 'Contatos',
      svgPath: '/images/contatos.svg',
      gradientColors: { from: '#F6921E', to: '#EE413D' },
      onClick: () => navigate(`/dashboard/clinic/${clinic.id}/contacts`)
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      svgPath: '/images/dashboard.svg',
      gradientColors: { from: '#F6921E', to: '#EE413D' },
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
      {/* Cabeçalho com nome da clínica */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-5 pl-1">
        <div className="flex-1 mb-2 sm:mb-0">
          <h1 className="text-[21px] font-medium text-gray-900 mt-2">{clinic.name}</h1>
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
                gradientColors={item.gradientColors}
                decorativeElement="svg"
                svgPath={item.svgPath}
                svgStyle={{
                  width: '140px',
                  height: '140px',
                  bottom: '-10px',
                  right: '-10px'
                }}
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