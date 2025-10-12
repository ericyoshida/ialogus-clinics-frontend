import { AddClinicCard } from '@/components/dashboard/AddClinicCard'
import { ClinicFeatureCard } from '@/components/dashboard/ClinicFeatureCard'
import { PlanCard } from '@/components/dashboard/PlanCard'
import { TasksCard } from '@/components/dashboard/TasksCard'
import { WelcomeCard } from '@/components/dashboard/WelcomeCard'
import { useAuth } from '@/contexts/AuthContext'
import { useClinics } from '@/hooks/use-clinics'
import { Clinic } from '@/services/clinics'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Interface para clínicas com clinicId
interface ClinicWithClinicId extends Clinic {
  clinicId?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Usar o hook personalizado para buscar as clínicas do usuário
  const { clinics, loading, error, refetchClinics } = useClinics();

  const planStats = [
    { label: 'Pessoas', value: '10', max: '20' },
    { label: 'Conversas', value: '50', max: '100' },
    { label: 'Agentes', value: '0', max: '0' },
  ];

  // Estado para controlar a paginação das clínicas
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const clinicsPerPage = 3;
  
  // Verificar se clinics é um array
  const clinicsArray: Clinic[] = useMemo(() => {
    if (Array.isArray(clinics)) {
      return clinics;
    }
    console.warn('clinics não é um array:', clinics);
    return [];
  }, [clinics]);
  
  // Recarregar ao montar o componente
  useEffect(() => {
    refetchClinics();
  }, []);
  
  // Atualizar para a primeira página quando as clínicas mudarem
  useEffect(() => {
    setCurrentPage(0);
  }, [clinicsArray.length]);
  
  // Calcular total de páginas com base nas clínicas disponíveis
  const totalPages = Math.max(1, Math.ceil(clinicsArray.length / clinicsPerPage));
  
  // Clínicas a serem exibidas na página atual
  const displayedClinics = useMemo(() => {
    if (loading) return [];
    if (!Array.isArray(clinicsArray)) return [];
    
    return clinicsArray.slice(
      currentPage * clinicsPerPage,
      (currentPage + 1) * clinicsPerPage
    );
  }, [clinicsArray, currentPage, clinicsPerPage, loading]);

  // Função para navegar para a próxima página com animação
  const nextPage = () => {
    if (isAnimating || currentPage >= totalPages - 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage((prev) => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  // Função para navegar para a página anterior com animação
  const prevPage = () => {
    if (isAnimating || currentPage <= 0) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage((prev) => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  // Verifica se as setas de navegação devem ser exibidas
  const showNavigation = clinicsArray.length > clinicsPerPage;
  
  // Verifica se está na primeira ou última página
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;
  
  // Função para obter o caminho do SVG com base no índice
  const getSvgPath = (index: number) => {
    const svgIndex = (index % 3) + 1;
    return `/images/ialogus-clinic-${svgIndex}.svg`;
  };

  // Verificar se IDs são válidos e logs para depuração
  useEffect(() => {
    if (clinicsArray.length > 0) {
      console.log('Clinics no Dashboard:', clinicsArray.map(c => ({
        id: c.id,
        clinicId: (c as ClinicWithClinicId).clinicId || 'não disponível',
        name: c.name
      })));
      
      // Verifica se todas as clínicas têm IDs válidos
      clinicsArray.forEach(clinic => {
        if (!clinic.id) {
          console.warn('Clínica sem ID encontrada:', clinic);
        }
      });
    }
  }, [clinicsArray]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="aspect-square w-full max-w-[325px] mx-auto">
          <WelcomeCard name={user?.name?.split(' ')[0] || 'Usuário'} />
        </div>
        <div className="aspect-square w-full max-w-[325px] mx-auto">
          <PlanCard planName="Free" stats={planStats} />
        </div>
        <div className="aspect-square w-full max-w-[325px] mx-auto">
          <TasksCard 
            count={4} 
            description="Você precisa realizar algumas tarefas para aproveitar toda performance da Ialogus." 
          />
        </div>
      </div>
      
      {/* Cards de Minhas Clínicas */}
      <div>
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Minhas Clínicas</h2>
          
          {/* Controles de navegação aproximados do título */}
          {showNavigation && !loading && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={prevPage} 
                className={`p-1.5 rounded-full bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-200 shadow-sm ${
                  isAnimating || isFirstPage ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                aria-label="Página anterior"
                disabled={isAnimating || isFirstPage}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              {/* Indicador de página */}
              <span className="text-sm text-gray-500 font-medium px-1">
                {currentPage + 1} / {totalPages}
              </span>
              
              <button 
                onClick={nextPage} 
                className={`p-1.5 rounded-full bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-200 shadow-sm ${
                  isAnimating || isLastPage ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                aria-label="Próxima página"
                disabled={isAnimating || isLastPage}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {/* Estado de carregamento */}
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square w-full max-w-[325px] mx-auto">
                  <div className="h-full w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Mensagem de erro */}
          {error && !loading && (
            <div className="col-span-full text-center py-8">
              <p className="text-red-500 mb-2">{error}</p>
              <button 
                onClick={refetchClinics}
                className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}
          
          {/* Mensagem quando não há clínicas */}
          {!loading && !error && clinicsArray.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 mb-2">Você ainda não tem clínicas cadastradas.</p>
              <p className="text-sm text-gray-400 mb-4">Clique no botão abaixo para adicionar sua primeira clínica.</p>
            </div>
          )}
          
          {/* Clínicas da página atual */}
          {!loading && !error && displayedClinics.map((clinic, index) => {
            // Verificar se o ID existe e exibir log para depuração
            if (!clinic.id) {
              console.warn('Clínica sem ID encontrada:', clinic);
              return null; // Não renderizar clínicas sem ID
            }
            
            // Log mais detalhado quando uma clínica é renderizada
            console.log(`Renderizando clínica ${index}:`, { 
              id: clinic.id, 
              clinicId: (clinic as ClinicWithClinicId).clinicId || 'não disponível' 
            });
            
            return (
              <div key={clinic.id} className="aspect-square w-full max-w-[325px] mx-auto">
                <ClinicFeatureCard 
                  name={clinic.name}
                  id={clinic.id}
                  svgPath={getSvgPath(index)}
                />
              </div>
            );
          })}
          
          {/* Botão de adicionar clínica sempre aparece na última posição */}
          <div className="aspect-square w-full max-w-[325px] mx-auto">
            <AddClinicCard 
              onClick={() => {
                console.log('Add clinic clicked');
                navigate('/dashboard/clinic/create', {
                  state: { from: '/dashboard' }
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
