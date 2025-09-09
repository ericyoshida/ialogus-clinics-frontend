import { FeatureCard } from '@/components/ui/feature-card';
import { Edit2, MoreVertical, Package, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CatalogCardProps {
  id: string;
  name: string;
  productCount: number;
  gradientColors: { from: string; to: string };
  onEdit: () => void;
  onDelete: () => void;
}

export function CatalogCard({ 
  id,
  name, 
  productCount,
  gradientColors,
  onEdit,
  onDelete
}: CatalogCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  // Definir estilos personalizados para o SVG
  const customSvgStyle = {
    bottom: '-18px',
    right: '-5px',
  };
  
  return (
    <div className="w-[250px] h-[250px] relative">
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
      
      <div className="w-full h-full">
        <FeatureCard
          title={name}
          description={`Catálogo com ${productCount} ${productCount === 1 ? 'produto' : 'produtos'}`}
          decorativeElement="svg"
          svgPath="/images/product-image.svg"
          svgStyle={customSvgStyle}
          gradientColors={gradientColors}
          className="h-full w-full aspect-square cursor-default"
        >
        </FeatureCard>
      </div>
      <div className="absolute bottom-3 left-3 z-10">
        <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
          {productCount} {productCount === 1 ? 'produto' : 'produtos'}
        </span>
      </div>
    </div>
  );
}