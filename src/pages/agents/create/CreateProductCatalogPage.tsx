import { IalogusInput } from '@/components/ui/ialogus-input'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { productsService } from '@/services'
import { Product } from '@/services/products'
import { Edit2, Loader2, MoreVertical, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCompanies } from '@/hooks/use-companies'

// Função para normalizar texto removendo acentos e convertendo para minúsculas
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Card de adicionar produtos
function AddProductCard({ companyId }: { companyId?: string }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/dashboard/company/${companyId}/agents/create/product-catalog/create/product`);
  };

  return (
    <div
      onClick={handleClick}
      className="w-[140px] flex-shrink-0 bg-white border border-dashed border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer pb-2"
    >
      {/* Área da imagem - mesma altura dos outros cards */}
      <div className="w-full h-[100px] flex items-center justify-center p-2">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="text-gray-600"
          >
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      {/* Nome do produto - mesma estrutura dos outros cards */}
      <div className="text-center px-2 mt-1">
        <p 
          className="text-xs font-medium text-gray-800 leading-tight"
          style={{
            minHeight: '3.75rem', // Mesma altura dos outros cards
            maxHeight: '3.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Adicionar Produto
        </p>
      </div>
    </div>
  );
}

// Card de produto com checkbox
function ProductCard({ 
  product, 
  selected, 
  onToggle,
  onEdit,
  onDelete
}: { 
  product: { 
    id: string;
    name: string;
    imagePath?: string;
    price?: number;
  };
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div 
      className={`w-[140px] flex-shrink-0 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border ${selected ? 'border-orange-400' : 'border-gray-100'} pb-2 relative cursor-pointer`}
      onClick={onToggle}
    >
      {/* Checkbox no canto superior direito */}
      <div className="absolute top-1 right-1 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation(); // Evitar que o clique do checkbox propague para o card
            onToggle();
          }}
          className="h-4 w-4 rounded-sm border-gray-300 text-orange-500 focus:ring-orange-500"
        />
      </div>
      
      {/* Menu dropdown no canto superior esquerdo */}
      <div className="absolute top-1 left-1 z-10">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors shadow-sm"
            title="Opções"
          >
            <MoreVertical size={12} />
          </button>
          
          {/* Menu dropdown */}
          {showMenu && (
            <>
              {/* Overlay para fechar o menu */}
              <div 
                className="fixed inset-0 z-20" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              
              {/* Menu */}
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 min-w-[120px]">
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
      
      {/* Imagem centralizada */}
      <div className="w-full h-[100px] flex items-center justify-center p-2 bg-white">
        {product.imagePath ? (
          <img 
            src={product.imagePath}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="text-gray-400"
            >
              <path d="M20 9H4V8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V9ZM4 11H20V16C20 17.1046 19.1046 18 18 18H6C4.89543 18 4 17.1046 4 16V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      
      {/* Nome do produto abaixo da imagem - melhorado para 3 linhas com ellipsis apenas na última */}
      <div className="text-center px-2 mt-1">
        <div 
          className="text-xs font-medium text-gray-700 leading-tight"
          title={product.name}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            minHeight: '3.75rem',
            maxHeight: '3.75rem',
            lineHeight: '1.25rem' // Altura específica para cada linha
          }}
        >
          {product.name}
        </div>
        {product.price !== undefined && (
          <p className="text-xs text-gray-500 mt-1">R$ {product.price.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}

// Card menor para produtos selecionados
function SelectedProductCard({ 
  product, 
  onRemove
}: { 
  product: { 
    id: string;
    name: string;
    imagePath?: string;
    price?: number;
  };
  onRemove: () => void;
}) {
  return (
    <div className="w-[110px] flex-shrink-0 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 pb-1 relative">
      {/* Imagem centralizada */}
      <div className="w-full h-[80px] flex items-center justify-center p-2 bg-white">
        {product.imagePath ? (
          <img 
            src={product.imagePath}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="text-gray-400"
            >
              <path d="M20 9H4V8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V9ZM4 11H20V16C20 17.1046 19.1046 18 18 18H6C4.89543 18 4 17.1046 4 16V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      
      {/* Nome do produto abaixo da imagem - melhorado para 3 linhas com ellipsis apenas na última */}
      <div className="text-center px-2">
        <div 
          className="text-xs font-medium text-gray-700 leading-tight"
          title={product.name}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            minHeight: '3.75rem',
            maxHeight: '3.75rem',
            lineHeight: '1.25rem' // Altura específica para cada linha
          }}
        >
          {product.name}
        </div>
        {product.price !== undefined && (
          <p className="text-xs text-gray-500 mt-1">R$ {product.price.toFixed(2)}</p>
        )}
      </div>
      
      {/* Botão de remover */}
      <div className="flex justify-center mt-1 mb-1">
        <button 
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
          title="Remover produto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// Componente de confirmação de exclusão
function DeleteConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName,
  isDeleting 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  productName: string;
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
          Tem certeza que deseja excluir o produto <strong>"{productName}"</strong>? 
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

export default function CreateProductCatalogPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();
  const { companies } = useCompanies();
  const companyName = companies.find(c => c.id === companyId)?.name || 'Carregando...';
  
  // Estado para o nome do catálogo
  const [catalogName, setCatalogName] = useState('');
  
  // Estado para armazenar os produtos selecionados
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  
  // Estado para o filtro de pesquisa
  const [searchFilter, setSearchFilter] = useState('');
  
  // Estado para controlar o carregamento dos produtos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para armazenar todos os produtos da API
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  
  // Estado para controlar o envio do formulário
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para controlar a exclusão de produtos
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Verificar se está em modo de edição
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  
  // Carregar produtos da API quando o componente montar
  useEffect(() => {
    // Verificar se está em modo de edição
    const editingId = localStorage.getItem('temp_editing_catalog_id');
    if (editingId) {
      setIsEditMode(true);
      setEditingCatalogId(editingId);
      
      // Carregar dados do catálogo para edição
      const catalogName = localStorage.getItem('temp_editing_catalog_name');
      const catalogProducts = localStorage.getItem('temp_editing_catalog_products');
      
      if (catalogName) {
        setCatalogName(catalogName);
      }
      
      if (catalogProducts) {
        try {
          const productsIds = JSON.parse(catalogProducts);
          setSelectedProducts(new Set(productsIds));
        } catch (error) {
          console.error('Erro ao carregar produtos do catálogo:', error);
        }
      }
    }
    
    // Função para carregar produtos da API
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar o ID da empresa da URL
        if (!companyId) {
          throw new Error('Nenhuma empresa selecionada.');
        }
        
        console.log('Carregando produtos para empresa:', companyId);
        
        // Carregar produtos da API
        const products = await productsService.getCompanyProducts(companyId);
        
        console.log('Produtos carregados:', products);
        
        setApiProducts(products);
        
        // Carregar produtos selecionados do localStorage se existirem
        const savedSelectedProducts = localStorage.getItem('temp_selected_products');
        if (savedSelectedProducts && !isEditMode) {
          try {
            const selectedIds = JSON.parse(savedSelectedProducts);
            setSelectedProducts(new Set(selectedIds));
          } catch (error) {
            console.error('Erro ao carregar produtos selecionados:', error);
          }
        }
        
        // Carregar nome do catálogo do localStorage se existir
        const savedCatalogName = localStorage.getItem('temp_catalog_name');
        if (savedCatalogName && !isEditMode) {
          setCatalogName(savedCatalogName);
        }
        
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar produtos');
        toast({
          title: "Erro ao carregar produtos",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao carregar os produtos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [toast, isEditMode, companyId]);
  
  // Salvar o nome do catálogo no localStorage quando ele mudar
  useEffect(() => {
    if (catalogName) {
      localStorage.setItem('temp_catalog_name', catalogName);
    }
  }, [catalogName]);
  
  // Mapear produtos da API para o formato do componente
  const mappedProducts = apiProducts.map(product => ({
    id: product.productId,
    name: product.productName,
    price: product.productPrice ? Number(product.productPrice) : undefined,
    description: product.productDescription,
    // Imagem padrão para produtos
    imagePath: '/images/product-image.svg'
  }));
  
  // Filtrar produtos baseado na pesquisa, ignorando acentuação
  const filteredProducts = mappedProducts.filter(product => {
    const normalizedName = normalizeText(product.name);
    const normalizedSearch = normalizeText(searchFilter);
    return normalizedName.includes(normalizedSearch);
  });
  
  // Função para alternar a seleção de um produto
  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    
    setSelectedProducts(newSelection);
    
    // Salvar a seleção atualizada no localStorage
    localStorage.setItem('temp_selected_products', JSON.stringify(Array.from(newSelection)));
  };
  
  // Função para remover um produto da seleção
  const removeProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    newSelection.delete(productId);
    setSelectedProducts(newSelection);
    
    // Salvar a seleção atualizada no localStorage
    localStorage.setItem('temp_selected_products', JSON.stringify(Array.from(newSelection)));
  };
  
  // Obter produtos selecionados
  const getSelectedProductsList = () => {
    return mappedProducts.filter(product => selectedProducts.has(product.id));
  };
  
  // Função para tentar novamente em caso de erro
  const handleRetry = () => {
    // Reiniciar o processo de busca de produtos
    setLoading(true);
    setError(null);
    
    // Usar o ID da empresa da URL
    if (!companyId) {
      setError('Nenhuma empresa selecionada.');
      setLoading(false);
      return;
    }
    
    // Buscar produtos novamente
    productsService.getCompanyProducts(companyId)
      .then(products => {
        setApiProducts(products);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar produtos:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
        setLoading(false);
      });
  };
  
  // Função para adicionar novo produto (temporariamente apenas navega)
  const handleAddProduct = () => {
    toast({
      title: "Função em desenvolvimento",
      description: "A funcionalidade de adicionar novos produtos está em desenvolvimento.",
    });
  };
  
  // Função para salvar o catálogo
  const handleSave = async () => {
    if (!catalogName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira um nome para o catálogo",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedProducts.size === 0) {
      toast({
        title: "Seleção necessária",
        description: "Por favor, selecione pelo menos um produto para o catálogo",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Usar o ID da empresa da URL
      if (!companyId) {
        throw new Error('Nenhuma empresa selecionada.');
      }
      
      // Preparar dados para o backend conforme o schema esperado
      const catalogData = {
        name: catalogName,
        description: `Catálogo com ${selectedProducts.size} produtos selecionados`,
        productsIds: Array.from(selectedProducts)
      };
      
      console.log('Enviando dados para salvar catálogo:', catalogData);
      
      if (isEditMode && editingCatalogId) {
        // Modo de edição - atualizar catálogo existente
        await productsService.editProductsList(editingCatalogId, catalogData);
        
        toast({
          title: "Catálogo atualizado",
          description: `O catálogo "${catalogName}" foi atualizado com sucesso.`,
        });
      } else {
        // Modo de criação - criar novo catálogo
        await productsService.createProductsList(companyId, catalogData);
        
        toast({
          title: "Catálogo criado",
          description: `O catálogo "${catalogName}" foi criado com sucesso.`,
        });
      }
      
      // Limpar dados temporários
      localStorage.removeItem('temp_catalog_name');
      localStorage.removeItem('temp_selected_products');
      localStorage.removeItem('temp_editing_catalog_id');
      localStorage.setItem('catalog_saved', 'true');
      
      // Voltar para a página de seleção de catálogo
      navigate(`/dashboard/company/${companyId}/agents/create/product-catalog`);
    } catch (error) {
      console.error('Erro ao salvar catálogo:', error);
      toast({
        title: isEditMode ? "Erro ao atualizar catálogo" : "Erro ao criar catálogo",
        description: error instanceof Error 
          ? error.message 
          : "Ocorreu um erro ao salvar o catálogo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para cancelar e voltar
  const handleCancel = () => {
    // Limpar o localStorage ao cancelar
    localStorage.removeItem('temp_catalog_products');
    localStorage.removeItem('temp_selected_products');
    localStorage.removeItem('temp_catalog_name');
    localStorage.removeItem('temp_editing_catalog_id');
    localStorage.removeItem('temp_editing_catalog_name');
    localStorage.removeItem('temp_editing_catalog_products');
    localStorage.removeItem('catalog_saved');
    
    navigate(`/dashboard/company/${companyId}/agents/create/product-catalog`);
  };
  
  // Função para editar produto
  const handleEditProduct = (productId: string) => {
    // Encontrar o produto na lista de produtos da API
    const productToEdit = apiProducts.find(p => p.productId === productId);
    
    if (!productToEdit) {
      toast({
        title: "Erro",
        description: "Produto não encontrado na lista.",
        variant: "destructive",
      });
      return;
    }
    
    // Navegar para a página de edição passando os dados do produto
    navigate(`/dashboard/company/${companyId}/agents/create/product-catalog/edit/product/${productId}`, {
      state: { productData: productToEdit }
    });
  };

  // Função para iniciar exclusão de produto
  const handleDeleteProduct = (productId: string) => {
    const product = apiProducts.find(p => p.productId === productId);
    if (!product) return;

    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  // Função para confirmar exclusão
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      
      // Chamar API para deletar produto
      await productsService.deleteProduct(productToDelete.productId);
      
      // Remover produto da lista local
      setApiProducts(prev => prev.filter(p => p.productId !== productToDelete.productId));
      
      // Remover produto da seleção se estiver selecionado
      if (selectedProducts.has(productToDelete.productId)) {
        const newSelection = new Set(selectedProducts);
        newSelection.delete(productToDelete.productId);
        setSelectedProducts(newSelection);
        localStorage.setItem('temp_selected_products', JSON.stringify(Array.from(newSelection)));
      }
      
      toast({
        title: "Produto excluído",
        description: `O produto "${productToDelete.productName}" foi excluído com sucesso.`,
      });
      
      // Fechar dialog
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro ao excluir produto",
        description: "Ocorreu um erro ao excluir o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para cancelar exclusão
  const cancelDeleteProduct = () => {
    setShowDeleteDialog(false);
    setProductToDelete(null);
  };
  
  return (
    <div className="max-w-7xl -mt-4 px-2 sm:px-3 lg:px-4 pb-6">
      {/* Cabeçalho com título */}
      <div className="flex flex-col mb-5">
        <h1 className="text-[21px] font-medium text-gray-900 mt-2 flex items-center gap-2">
          {isEditMode ? 'Editar Catálogo' : 'Criar Novo Catálogo'}
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{companyName}</span>
        </h1>
      </div>
      
      {/* Input para o nome do catálogo */}
      <div className="mb-5 max-w-xl">
        <div className="w-full overflow-hidden rounded-md">
          <IalogusInput
            label="Nome do Catálogo"
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
            className="w-full bg-white focus:bg-orange-50"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Este nome será exibido para os agentes durante as conversas
        </p>
      </div>
      
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
      
      {/* Box de seleção de produtos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        {/* Cabeçalho com título e filtro */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
          <h2 className="text-base font-medium text-gray-600">
            Selecione o Produto ou Serviço
          </h2>
          
          {/* Filtro de nome */}
          <div className="relative w-full sm:w-[240px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Filtrar por nome..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 py-1 h-8 text-sm bg-gray-50 border-gray-200 focus:ring-orange-500 focus:border-orange-500 rounded-md"
            />
          </div>
        </div>
        
        {/* Lista horizontal de produtos com scroll */}
        <div className="overflow-x-auto pb-2">
          {loading ? (
            // Estado de carregamento
            <div className="flex items-center justify-center h-[150px]">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Carregando produtos...</p>
              </div>
            </div>
          ) : (
            <div className="flex space-x-3" style={{ paddingBottom: '4px' }}>
              {/* Card para adicionar produto - completamente separado dos demais */}
              <div className="flex-shrink-0">
                <AddProductCard companyId={companyId} />
              </div>
              
              {/* Renderização dos produtos ou mensagem de não encontrado */}
              <div className="flex space-x-3">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      selected={selectedProducts.has(product.id)}
                      onToggle={() => toggleProductSelection(product.id)}
                      onEdit={() => handleEditProduct(product.id)}
                      onDelete={() => handleDeleteProduct(product.id)}
                    />
                  ))
                ) : searchFilter ? (
                  <div className="py-4 px-3 text-gray-500 text-sm">
                    Nenhum produto encontrado com o termo "{searchFilter}"
                  </div>
                ) : apiProducts.length === 0 ? (
                  <div className="py-4 px-3 text-gray-500 text-sm">
                    Nenhum produto cadastrado. Clique no botão ao lado para adicionar produtos ao catálogo.
                  </div>
                ) : (
                  <div className="py-4 px-3 text-gray-500 text-sm">
                    Clique no botão ao lado para adicionar produtos ao catálogo.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Seção de produtos selecionados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-5">
        <div className="flex items-center mb-3">
          <h2 className="text-base font-medium text-gray-600">
            Selecionados
          </h2>
          <span className="ml-2 text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            {selectedProducts.size} {selectedProducts.size === 1 ? 'item' : 'itens'}
          </span>
        </div>
        
        {/* Lista horizontal de produtos selecionados com scroll */}
        <div className="overflow-x-auto pb-1">
          {selectedProducts.size > 0 ? (
            <div className="flex flex-wrap gap-3">
              {getSelectedProductsList().map((product) => (
                <SelectedProductCard
                  key={product.id}
                  product={product}
                  onRemove={() => removeProductSelection(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500 text-sm border border-dashed border-gray-200 rounded-md bg-gray-50">
              Nenhum produto selecionado. Selecione produtos acima para adicioná-los ao catálogo.
            </div>
          )}
        </div>
      </div>
      
      {/* Botões de ação */}
      <div className="flex mt-6">
        <button
          onClick={handleCancel}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-md text-white transition-colors"
          style={{ 
            background: 'linear-gradient(90deg, #F6921E, #EE413D)',
            opacity: (!catalogName.trim() || selectedProducts.size === 0 || loading || isSubmitting) ? 0.7 : 1 
          }}
          disabled={!catalogName.trim() || selectedProducts.size === 0 || loading || isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Catálogo')}
        </button>
      </div>
      
      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={cancelDeleteProduct}
        onConfirm={confirmDeleteProduct}
        productName={productToDelete?.productName || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
} 