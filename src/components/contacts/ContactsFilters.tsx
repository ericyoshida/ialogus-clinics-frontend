import { IalogusInput } from '@/components/ui/ialogus-input'
import { CustomersFilters } from '@/services/customers'
import { Filter, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface ContactsFiltersProps {
  filters: CustomersFilters;
  onFiltersChange: (filters: CustomersFilters) => void;
  totalCount?: number;
}

export const ContactsFilters: React.FC<ContactsFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount
}) => {
  const [localFilters, setLocalFilters] = useState<CustomersFilters>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (field: keyof CustomersFilters, value: string) => {
    const newFilters = {
      ...localFilters,
      [field]: value || undefined
    };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    // Remove campos vazios antes de aplicar os filtros
    const cleanedFilters: CustomersFilters = {
      page: 1,
      perPage: 20
    };
    
    if (localFilters.name && localFilters.name.trim()) {
      cleanedFilters.name = localFilters.name.trim();
    }
    
    if (localFilters.phoneNumber && localFilters.phoneNumber.trim()) {
      cleanedFilters.phoneNumber = localFilters.phoneNumber.trim();
    }
    
    if (localFilters.lastChatLogStatus && localFilters.lastChatLogStatus.trim()) {
      cleanedFilters.lastChatLogStatus = localFilters.lastChatLogStatus.trim() as "active" | "waiting_response" | "inactive";
    }
    
    onFiltersChange(cleanedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      page: 1,
      perPage: 20
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = !!(localFilters.name || localFilters.phoneNumber || localFilters.lastChatLogStatus);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="p-4">
        {/* Linha principal com busca rápida */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <IalogusInput
              label="Buscar por nome..."
              value={localFilters.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-white focus:bg-orange-50"
            />
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors h-14"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-[#F15A24] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por telefone */}
              <div>
                <IalogusInput
                  label="Telefone"
                  value={localFilters.phoneNumber || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-white focus:bg-orange-50"
                />
              </div>

              {/* Filtro por status */}
              <div>
                <div className="relative">
                  <select
                    value={localFilters.lastChatLogStatus || ''}
                    onChange={(e) => handleInputChange('lastChatLogStatus', e.target.value)}
                    className="w-full h-14 px-3 pt-6 pb-2 bg-gray-100 rounded-md border-0 focus:ring-0 focus:bg-orange-50 outline-none text-base appearance-none cursor-pointer"
                  >
                    <option value="">Todos os status</option>
                    <option value="active">Conversa Ativa</option>
                    <option value="waiting_response">Aguardando Resposta</option>
                    <option value="inactive">Sem conversa ativa</option>
                  </select>
                  <label className="absolute top-2 left-3 text-xs text-gray-600 pointer-events-none">
                    Status
                  </label>
                  <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
                    <div className="w-full h-0.5 bg-gradient-to-r from-gray-300 via-blue-300 to-blue-600" />
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-end gap-2">
                <button
                  onClick={applyFilters}
                  className="flex-1 px-5 py-2 rounded-md text-white transition-colors h-14"
                  style={{ 
                    background: 'linear-gradient(90deg, #F6921E, #EE413D)'
                  }}
                >
                  Aplicar Filtros
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors h-14"
                    title="Limpar filtros"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contador de resultados */}
        {totalCount !== undefined && (
          <div className="mt-3 text-sm text-gray-500">
            {totalCount === 0 ? (
              'Nenhum contato encontrado'
            ) : totalCount === 1 ? (
              '1 contato encontrado'
            ) : (
              `${totalCount} contatos encontrados`
            )}
            {hasActiveFilters && ' com os filtros aplicados'}
          </div>
        )}
      </div>
    </div>
  );
}; 