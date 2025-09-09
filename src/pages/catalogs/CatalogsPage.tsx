import { AddCatalogCard } from '@/components/catalogs/AddCatalogCard'
import { CatalogCard } from '@/components/catalogs/CatalogCard'
import { useToast } from '@/hooks/use-toast'
import { useCompanies } from '@/hooks/use-companies'
import * as productsService from '@/services/products'
import { Product, ProductsList } from '@/services/products'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function CatalogsPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();
  
  const [company, setCompany] = useState<{
    name: string;
    id: string | undefined;
  }>({
    name: "Carregando...",
    id: companyId
  });
  
  // Buscar as empresas para encontrar o nome da empresa pelo ID
  const { companies, loading: loadingCompanies } = useCompanies();
  
  // Estados para gerenciar os catálogos
  const [catalogs, setCatalogs] = useState<ProductsList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  
  // Estado para controlar a paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Número fixo de catálogos por página
  const catalogsPerPage = 6;
  
  // State para armazenar o número de colunas baseado no tamanho da tela
  const [columns, setColumns] = useState(4);
  
  // Atualizar o nome da empresa quando as empresas forem carregadas
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
  
  // Efeito para atualizar o número de colunas quando a tela mudar de tamanho
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumns(1); // Mobile: 1 coluna
      } else if (window.innerWidth < 1024) {
        setColumns(2); // Tablet: 2 colunas
      } else if (window.innerWidth < 1440) {
        setColumns(3); // Desktop menor: 3 colunas
      } else {
        setColumns(4); // Desktop maior: 4 colunas
      }
    };

    // Inicializar
    handleResize();

    // Adicionar listener
    window.addEventListener('resize', handleResize);
    
    // Limpar listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Carregar catálogos quando o componente montar
  useEffect(() => {
    fetchCatalogs();
  }, [companyId]);
  
  // Função para buscar catálogos
  const fetchCatalogs = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const productCatalogs = await productsService.getProductsLists(companyId);
      setCatalogs(productCatalogs);
    } catch (err) {
      console.error('Erro ao buscar catálogos de produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar catálogos de produtos.');
    } finally {
      setLoading(false);
    }
  };
  
  // Configurações de paginação
  const totalCatalogs = catalogs.length;
  const totalPages = Math.ceil(totalCatalogs / catalogsPerPage);
  
  // Obter os catálogos para a página atual
  const getPageCatalogs = () => {
    const start = currentPage * catalogsPerPage;
    const end = start + catalogsPerPage;
    return catalogs.slice(start, end);
  };
  
  // Funções de navegação
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
  
  // Ir para uma página específica
  const goToPage = (pageNumber: number) => {
    if (isAnimating || pageNumber === currentPage) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setIsAnimating(false);
    }, 300);
  };
  
  // Obter os catálogos da página atual
  const currentCatalogs = getPageCatalogs();
  
  // Verificar se precisa mostrar a navegação
  const showNavigation = totalPages > 1;
  
  // Verificar se está na primeira ou última página
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;
  
  // Estilo com dimensões fixas para os cards
  const cardSize = 250;
  const cardStyle = {
    width: `${cardSize}px`,
    height: `${cardSize}px`,
    display: 'block',
  };
  
  // Construir o estilo do grid baseado no número de colunas
  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, ${cardSize}px)`,
    columnGap: '1.25rem',
    rowGap: '2rem',
    justifyContent: columns === 1 ? 'center' : 'start',
  };
  
  
  // Função para adicionar novo catálogo
  const handleAddCatalog = () => {
    navigate(`/dashboard/company/${company.id}/catalogs/create`);
  };
  
  // Função para editar catálogo
  const handleEditCatalog = (catalog: ProductsList) => {
    // Salvar dados do catálogo no localStorage para edição
    localStorage.setItem('temp_editing_catalog_id', catalog.productsListId);
    localStorage.setItem('temp_editing_catalog_name', catalog.productsListName);
    localStorage.setItem('temp_editing_catalog_products', JSON.stringify(catalog.products.map(p => p.productId)));
    
    navigate(`/dashboard/company/${company.id}/catalogs/edit/${catalog.productsListId}`);
  };
  
  // Função para deletar catálogo
  const handleDeleteCatalog = async (catalogId: string) => {
    try {
      await productsService.deleteProductsList(catalogId);
      
      toast({
        title: "Catálogo excluído",
        description: "O catálogo foi excluído com sucesso.",
      });
      
      // Recarregar catálogos
      fetchCatalogs();
    } catch (error) {
      console.error('Erro ao excluir catálogo:', error);
      toast({
        title: "Erro ao excluir catálogo",
        description: "Ocorreu um erro ao excluir o catálogo.",
        variant: "destructive",
      });
    }
  };
  
  
  // Gerar cores de gradiente com base no ID
  const getGradientColors = (id: string) => {
    const gradients = [
      { from: '#F6921E', to: '#EE413D' },
      { from: '#4F46E5', to: '#8B5CF6' },
      { from: '#10B981', to: '#059669' },
      { from: '#F97316', to: '#C2410C' },
      { from: '#8B5CF6', to: '#6D28D9' }
    ];
    
    const idSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[idSum % gradients.length];
  };
  
  // Loading state
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
      {/* Cabeçalho com nome da empresa e controles de paginação */}
      <div className="flex flex-col sm:flex-row items-start gap-2 mb-5 pl-1">
        <div className="flex-1 mb-2 sm:mb-0">
          <h1 className="text-[21px] font-medium text-gray-900 mt-2">
            Catálogos de Produtos - {company.name}
          </h1>
          <p className="text-gray-500 text-sm">Gerenciamento de catálogos e produtos</p>
        </div>
        
        {/* Controles de navegação */}
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
            
            {/* Paginação numérica */}
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
      
      {/* Estado de carregamento */}
      {loading && (
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
      
      {/* Mensagem de erro */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchCatalogs}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      {/* Grid container para catálogos */}
      {!loading && !error && (
        <>
          {catalogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 mb-2">Nenhum catálogo encontrado</p>
              <p className="text-gray-500 mb-4">Clique no botão abaixo para criar seu primeiro catálogo</p>
              <div className="w-64 h-64 mx-auto">
                <AddCatalogCard onClick={handleAddCatalog} />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pb-8">
              <div className="inline-block min-w-full">
                <div style={gridContainerStyle} className="mx-auto">
                  {/* Card de adicionar catálogo sempre em primeiro */}
                  <div style={cardStyle} className="mx-auto">
                    <AddCatalogCard onClick={handleAddCatalog} />
                  </div>
                  
                  {/* Renderizar catálogos */}
                  {currentCatalogs.map((catalog) => (
                    <div key={catalog.productsListId} style={cardStyle} className="mx-auto">
                      <CatalogCard
                        id={catalog.productsListId}
                        name={catalog.productsListName}
                        productCount={catalog.products.length}
                        gradientColors={getGradientColors(catalog.productsListId)}
                        onEdit={() => handleEditCatalog(catalog)}
                        onDelete={() => handleDeleteCatalog(catalog.productsListId)}
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