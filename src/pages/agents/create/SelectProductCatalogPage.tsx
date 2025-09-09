import { FeatureCard } from '@/components/ui/feature-card'
import { MultiStepAgent } from '@/components/multi-step-agent'
import { useToast } from '@/hooks/use-toast'
import { productsService } from '@/services'
import { ProductsList } from '@/services/products'
import { Edit2, Loader2, MoreVertical, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCompanies } from '@/hooks/use-companies'


// Card de adicionar novo catálogo
function AddCatalogCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-[250px] h-[250px] bg-transparent border-none outline-none focus:outline-none p-0 m-0 cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:drop-shadow-[6px_6px_10px_rgba(0,0,0,0.15)]"
      aria-label="Adicionar novo catálogo"
    >
      <img 
        src="/images/add-product-catalog.svg" 
        alt="Adicionar novo catálogo" 
        className="w-full h-full object-contain"
      />
    </button>
  );
}

// Componente de confirmação de exclusão
function DeleteConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  catalogName,
  isDeleting 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  catalogName: string;
  isDeleting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Confirmar Exclusão
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir o catálogo <strong>"{catalogName}"</strong>? 
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Card wrapper component that handles hover state
function ProductCatalogCard({ 
  catalog, 
  selected, 
  onClick,
  onEdit,
  onDelete
}: { 
  catalog: { 
    id: string;
    title: string;
    description: string;
    imagePath: string;
    productCount: number;
    gradientColors: { from: string; to: string; }
  };
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Reference to manually trigger hover events on the card element
  const cardRef = useRef<HTMLDivElement>(null);
  const [forceHover, setForceHover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Apply hover effect when selected
  useEffect(() => {
    if (!cardRef.current) return;
    
    // If selected, dispatch a mouseenter event to trigger hover effect
    if (selected && !forceHover) {
      setForceHover(true);
      const enterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
      });
      cardRef.current.dispatchEvent(enterEvent);
    }
  }, [selected, forceHover]);
  
  // Definir estilos personalizados para o SVG
  const customSvgStyle = {
    bottom: '-18px',
    right: '-5px',
  };
  
  return (
    <div className="w-[250px] h-[250px] relative">
      {selected && (
        <div className="absolute -top-1 left-3 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-xs shadow-md border border-white" style={{ transform: 'translateY(-50%)' }}>
          Selecionado
        </div>
      )}
      
      {/* Menu dropdown no canto superior direito */}
      <div className="absolute top-2 right-2 z-40">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors shadow-sm"
            title="Opções"
          >
            <MoreVertical size={14} />
          </button>
          
          {/* Menu dropdown */}
          {showMenu && (
            <>
              {/* Overlay para fechar o menu */}
              <div 
                className="fixed inset-0 z-30" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              
              {/* Menu */}
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-40 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Edit2 size={14} className="mr-2" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 size={14} className="mr-2" />
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div ref={cardRef} className="w-full h-full">
        <FeatureCard
          title={catalog.title}
          description={catalog.description}
          decorativeElement="svg"
          svgPath="/images/product-image.svg"
          svgStyle={customSvgStyle}
          gradientColors={catalog.gradientColors}
          onClick={onClick}
          className={`h-full w-full aspect-square ${selected ? `ring-2 ring-offset-2 ring-[${catalog.gradientColors.from}]` : ''}`}
        >
        </FeatureCard>
      </div>
      <div className="absolute bottom-3 left-3 z-10">
        <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
          {catalog.productCount} {catalog.productCount === 1 ? 'produto' : 'produtos'}
        </span>
      </div>
      {selected && (
        <div 
          className="absolute inset-0 z-5 rounded-lg pointer-events-none"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0) 20%, ${catalog.gradientColors.from} 100%)`,
            opacity: 0.25,
          }}
        />
      )}
    </div>
  );
}

export default function SelectProductCatalogPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();
  
  // Buscar nome da empresa
  const { companies } = useCompanies();
  const companyName = companies.find(c => c.id === companyId)?.name || 'Carregando...';
  
  // Estado para o catálogo selecionado
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  // Estados para gerenciar os catálogos da API
  const [catalogs, setCatalogs] = useState<ProductsList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para controlar a exclusão de catálogos
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [catalogToDelete, setCatalogToDelete] = useState<ProductsList | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Gerar cores de gradiente com base no ID
  const getGradientColors = (id: string) => {
    const gradients = [
      { from: '#F6921E', to: '#EE413D' },
      { from: '#4F46E5', to: '#8B5CF6' },
      { from: '#10B981', to: '#059669' },
      { from: '#F97316', to: '#C2410C' },
      { from: '#8B5CF6', to: '#6D28D9' }
    ];
    
    // Usar a soma dos caracteres do ID para determinar o índice
    const idSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[idSum % gradients.length];
  };
  
  // Validar se temos um companyId
  useEffect(() => {
    if (!companyId) {
      navigate('/dashboard');
      return;
    }
  }, [companyId, navigate]);
  
  // Efeito para carregar catálogos quando o componente montar
  useEffect(() => {
    // Função para buscar catálogos
    const fetchCatalogs = async () => {
      if (!companyId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Buscar catálogos da API
        const productCatalogs = await productsService.getProductsLists(companyId);
        setCatalogs(productCatalogs);
        
        // Verificar se o catálogo selecionado anteriormente ainda existe
        const savedSelectedCatalog = localStorage.getItem('selected_catalog');
        if (savedSelectedCatalog) {
          // Verificar se o catálogo salvo existe na lista
          const catalogExists = productCatalogs.some(
            catalog => catalog.productsListId === savedSelectedCatalog
          );
          
          if (catalogExists) {
            setSelectedCatalog(savedSelectedCatalog);
          } else {
            localStorage.removeItem('selected_catalog');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar catálogos de produtos:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar catálogos de produtos.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCatalogs();
  }, [companyId]);
  
  // Função para selecionar um catálogo
  const selectCatalog = (catalogId: string) => {
    setSelectedCatalog(catalogId);
    // Salvar a seleção no localStorage
    localStorage.setItem('selected_catalog', catalogId);
  };
  
  // Função para adicionar um novo catálogo
  const handleAddNewCatalog = () => {
    console.log('Adicionar novo catálogo de produtos');
    // Navegar para a página de criação de catálogo
    navigate(`/dashboard/company/${companyId}/agents/create/product-catalog/create`);
  };
  
  // Função para avançar para a próxima etapa
  const handleNext = () => {
    if (!selectedCatalog) {
      // Você pode mostrar um alerta ou mensagem aqui
      toast({
        title: 'Seleção necessária',
        description: 'Por favor, selecione um catálogo de produtos para continuar',
        variant: 'destructive',
      });
      return;
    }
    
    // Salvar a seleção de catálogo no localStorage para persistência entre etapas
    localStorage.setItem('selected_catalog', selectedCatalog);
    
    // Navegar para a próxima etapa: informações adicionais
    navigate(`/dashboard/company/${companyId}/agents/create/additional-info`);
  };
  
  // Função para voltar à etapa anterior
  const handleBack = () => {
    navigate(`/dashboard/company/${companyId}/agents/create/conversation-flow`);
  };
  
  // Função para tentar novamente em caso de erro
  const handleRetry = () => {
    // Reiniciar o processo de busca de catálogos
    setLoading(true);
    setError(null);
    
    if (!companyId) {
      setError('Nenhuma empresa selecionada. Por favor, retorne à etapa 1.');
      setLoading(false);
      return;
    }
    
    // Buscar catálogos novamente
    productsService.getProductsLists(companyId)
      .then(productCatalogs => {
        setCatalogs(productCatalogs);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar catálogos de produtos:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar catálogos de produtos.');
        setLoading(false);
      });
  };
  
  // Função para editar catálogo
  const handleEditCatalog = (catalogId: string) => {
    const catalog = catalogs.find(c => c.productsListId === catalogId);
    if (catalog) {
      // Salvar dados do catálogo no localStorage para edição
      localStorage.setItem('temp_editing_catalog_id', catalogId);
      localStorage.setItem('temp_editing_catalog_name', catalog.productsListName);
      localStorage.setItem('temp_editing_catalog_products', JSON.stringify(catalog.products.map(p => p.productId)));
      
      // Navegar para a página de criação em modo de edição
      navigate(`/dashboard/company/${companyId}/agents/create/product-catalog/create`);
    }
  };

  // Função para iniciar exclusão de catálogo
  const handleDeleteCatalog = (catalogId: string) => {
    const catalog = catalogs.find(c => c.productsListId === catalogId);
    if (!catalog) return;

    setCatalogToDelete(catalog);
    setShowDeleteDialog(true);
  };

  // Função para confirmar exclusão
  const confirmDeleteCatalog = async () => {
    if (!catalogToDelete) return;

    try {
      setIsDeleting(true);
      
      // Chamar API para deletar catálogo
      await productsService.deleteProductsList(catalogToDelete.productsListId);
      
      // Remover catálogo da lista local
      setCatalogs(prev => prev.filter(c => c.productsListId !== catalogToDelete.productsListId));
      
      // Se o catálogo deletado estava selecionado, limpar seleção
      if (selectedCatalog === catalogToDelete.productsListId) {
        setSelectedCatalog(null);
        localStorage.removeItem('selected_catalog');
      }
      
      toast({
        title: "Catálogo excluído",
        description: `O catálogo "${catalogToDelete.productsListName}" foi excluído com sucesso.`,
      });
      
      // Fechar dialog
      setShowDeleteDialog(false);
      setCatalogToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir catálogo:', error);
      toast({
        title: "Erro ao excluir catálogo",
        description: "Ocorreu um erro ao excluir o catálogo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para cancelar exclusão
  const cancelDeleteCatalog = () => {
    setShowDeleteDialog(false);
    setCatalogToDelete(null);
  };
  
  // Mapear os catálogos da API para o formato do componente
  const mappedCatalogs = catalogs.map(catalog => ({
    id: catalog.productsListId,
    title: catalog.productsListName,
    description: `Catálogo com ${catalog.products.length} produtos para seu agente oferecer aos clientes.`,
    imagePath: '/images/product-image.svg',
    productCount: catalog.products.length,
    gradientColors: getGradientColors(catalog.productsListId)
  }));
  
  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-2">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          Criar Novo Agente
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{companyName}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-4">Etapa 3: Selecione o catálogo de produtos</p>
        
        {/* Indicador de multistep abaixo do título */}
        <div className="w-full mb-6">
          <MultiStepAgent 
            currentStep={3} 
            className="max-w-full"
          />
        </div>
        
        {/* Título principal e subtítulo */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-medium text-gray-800">Escolha um catálogo de produtos</h2>
        </div>
        
        {/* Subtítulo em uma linha separada */}
        <p className="text-sm text-gray-500 mb-6">Selecione um catálogo existente ou crie um novo para seu agente acessar durante as conversas</p>
        
        {/* Mensagem de erro da API */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
                <button 
                  onClick={handleRetry}
                  className="text-sm mt-1 text-red-700 hover:text-red-800 underline cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Cards de catálogo de produtos */}
      <div className="mb-8">
        {loading ? (
          // Estado de carregamento
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse space-y-4">
              <div className="flex space-x-10">
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
                <div className="rounded-lg bg-gray-200 h-[250px] w-[250px]"></div>
              </div>
              <p className="text-center text-gray-500">Carregando catálogos de produtos...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3 md:gap-[20px] flex-wrap">
            {/* Mostrar mensagem se não houver catálogos */}
            {!loading && mappedCatalogs.length === 0 && !error && (
              <div className="flex items-center justify-center w-full mb-4">
                <div className="text-center text-gray-500">
                  <p className="mb-2">Nenhum catálogo de produtos encontrado</p>
                  <p className="text-sm">Clique no botão "+" para adicionar um novo catálogo</p>
                </div>
              </div>
            )}
            
            {/* Card para adicionar novo catálogo */}
            <AddCatalogCard onClick={handleAddNewCatalog} />
            
            {/* Catálogos da API */}
            {mappedCatalogs.map((catalog) => (
              <ProductCatalogCard
                key={catalog.id}
                catalog={catalog}
                selected={selectedCatalog === catalog.id}
                onClick={() => selectCatalog(catalog.id)}
                onEdit={() => handleEditCatalog(catalog.id)}
                onDelete={() => handleDeleteCatalog(catalog.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Botões de navegação */}
      <div className="flex mt-10">
        <button
          onClick={handleBack}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          onClick={handleNext}
          className="px-5 py-2 rounded-md text-white transition-colors"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)',
            opacity: !selectedCatalog ? 0.7 : 1 
          }}
          disabled={!selectedCatalog || loading}
        >
          Próximo
        </button>
      </div>
      
      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={cancelDeleteCatalog}
        onConfirm={confirmDeleteCatalog}
        catalogName={catalogToDelete?.productsListName || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
} 