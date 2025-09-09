import { AddChannelCard } from '@/components/channels/AddChannelCard'
import { ChannelCard } from '@/components/channels/ChannelCard'
import { useChannels } from '@/hooks/use-channels'
import { useCompanies } from '@/hooks/use-companies'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function ChannelsPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<{
    name: string;
    id: string | undefined;
  }>({
    name: "Carregando...",
    id: companyId
  });
  
  const { companies, loading: loadingCompanies } = useCompanies();
  const { channels, loading: loadingChannels, error, refetchChannels } = useChannels(company.id);
  
  useEffect(() => {
    if (!loadingCompanies && companies.length > 0 && companyId) {
      const foundCompany = companies.find(c => c.id === companyId);
      
      if (foundCompany) {
        setCompany({
          name: foundCompany.name,
          id: companyId
        });
      } else {
        setCompany({
          name: "Empresa não encontrada",
          id: companyId
        });
      }
    }
  }, [companyId, companies, loadingCompanies]);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const channelsPerPage = 6;

  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumns(1);
      } else if (window.innerWidth < 1024) {
        setColumns(2);
      } else if (window.innerWidth < 1440) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalChannels = channels.length;
  const totalPages = Math.ceil(totalChannels / channelsPerPage);
  
  const getPageChannels = () => {
    const start = currentPage * channelsPerPage;
    const end = start + channelsPerPage;
    return channels.slice(start, end);
  };

  const nextPage = () => {
    if (isAnimating || currentPage >= totalPages - 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const prevPage = () => {
    if (isAnimating || currentPage <= 0) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  const goToPage = (pageNumber: number) => {
    if (isAnimating || pageNumber === currentPage) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setIsAnimating(false);
    }, 300);
  };

  const currentChannels = getPageChannels();

  // Removido distributeChannels - usando grid CSS diretamente

  const showNavigation = totalPages > 1;
  
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  const cardSize = 250;
  const cardStyle = {
    width: `${cardSize}px`,
    height: `${cardSize}px`,
    display: 'block',
  };

  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, ${cardSize}px)`,
    columnGap: '1.25rem',
    rowGap: '2rem',
    justifyContent: columns === 1 ? 'center' : 'start',
  };

  const handleChannelClick = (channelId: string) => {
    navigate(`/dashboard/company/${company.id}/channels/${channelId}`);
  };

  const handleAddChannel = () => {
    navigate(`/dashboard/company/${company.id}/channels/create/type`, {
      state: { 
        from: `/dashboard/company/${company.id}/channels`
      }
    });
  };

  if (loadingCompanies) {
    return (
      <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-pulse w-48 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="animate-pulse w-64 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      <div className="flex flex-col sm:flex-row items-start gap-2 mb-5 pl-1">
        <div className="flex-1 mb-2 sm:mb-0">
          <h1 className="text-[21px] font-medium text-gray-900 mt-2">
            Canais de Comunicação - {company.name}
          </h1>
          <p className="text-gray-500 text-sm">Gerenciamento de canais WhatsApp</p>
        </div>
        
        {showNavigation && (
          <div className="flex items-center space-x-1 mt-1 sm:mt-0">
            <button 
              onClick={prevPage}
              className={`p-1.5 rounded-full bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-200 shadow-sm ${
                isAnimating || isFirstPage ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              disabled={isAnimating || isFirstPage}
              aria-label="Página anterior"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            <div className="flex space-x-1">
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium
                    ${currentPage === idx
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  disabled={isAnimating || currentPage === idx}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <button 
              onClick={nextPage}
              className={`p-1.5 rounded-full bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-200 shadow-sm ${
                isAnimating || isLastPage ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              disabled={isAnimating || isLastPage}
              aria-label="Próxima página"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {loadingChannels && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-pulse w-48 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="animate-pulse w-64 h-4 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="animate-pulse w-64 h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      )}

      {error && !loadingChannels && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => company.id && refetchChannels(company.id)}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loadingChannels && !error && (
        <>
          {channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 mb-2">Nenhum canal encontrado</p>
              <p className="text-gray-500 mb-4">Clique no botão abaixo para criar seu primeiro canal</p>
              <div className="w-64 h-64 mx-auto">
                <AddChannelCard onClick={handleAddChannel} />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pb-8">
              <div className="inline-block min-w-full">
                <div style={gridContainerStyle} className="mx-auto">
                  <div style={cardStyle} className="mx-auto">
                    <AddChannelCard onClick={handleAddChannel} />
                  </div>
                  
                  {currentChannels.map((channel) => (
                    <div key={channel.id} style={cardStyle} className="mx-auto">
                      <ChannelCard
                        name={channel.botName}
                        phoneNumber={channel.phoneNumber}
                        region={channel.operationalRegion}
                        connectedAgents={channel.botModelsIDList?.length || 0}
                        status="active"
                        onClick={() => handleChannelClick(channel.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}