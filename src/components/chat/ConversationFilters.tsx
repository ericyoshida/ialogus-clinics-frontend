import { ChatLogsQueryParams } from "@/services/chats";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// CSS personalizado para hover nos selects
const selectHoverStyles = `
  .hover-select-wrapper {
    transition: all 0.2s ease;
  }
`;

// The props interface for the conversation filters component
interface ConversationFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ChatLogsQueryParams;
  onApplyFilters: (filters: ChatLogsQueryParams) => void;
}

export function ConversationFilters({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
}: ConversationFiltersProps) {
  // Local state to track filter changes before applying
  const [localFilters, setLocalFilters] = useState<ChatLogsQueryParams>(filters);
  const [selectedEngagementLevels, setSelectedEngagementLevels] = useState<number[]>([]);
  const [isEngagementDropdownOpen, setIsEngagementDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update local filters when the main filters change
  useEffect(() => {
    setLocalFilters(filters);
    // Parse engagement levels from the filter array
    if (filters.leadEngagements) {
      setSelectedEngagementLevels(filters.leadEngagements);
    } else {
      setSelectedEngagementLevels([]);
    }
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEngagementDropdownOpen(false);
      }
    };

    if (isEngagementDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEngagementDropdownOpen]);

  // Reset filters to their default values
  const handleResetFilters = () => {
    setLocalFilters({});
    setSelectedEngagementLevels([]);
    setIsEngagementDropdownOpen(false);
  };

  // Apply the filters and close the dialog
  const handleApplyFilters = () => {
    // Process the filters before applying
    const processedFilters = { ...localFilters };
    
    // Add engagement levels to the filters
    if (selectedEngagementLevels.length > 0) {
      processedFilters.leadEngagements = selectedEngagementLevels;
    } else {
      delete processedFilters.leadEngagements;
    }
    
    onApplyFilters(processedFilters);
    setIsEngagementDropdownOpen(false);
    onClose();
  };

  // Handle changes to boolean filters
  const handleBooleanChange = (key: keyof ChatLogsQueryParams) => (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value === 'true' ? true : value === 'false' ? false : undefined,
    }));
  };

  // Handle engagement level checkbox changes
  const handleEngagementLevelChange = (level: number, checked: boolean) => {
    setSelectedEngagementLevels(prev => {
      if (checked) {
        return [...prev, level];
      } else {
        return prev.filter(l => l !== level);
      }
    });
  };

  // Engagement level options
  const engagementLevelOptions = [
    { value: 1, label: "Muito Baixo (1)" },
    { value: 2, label: "Baixo (2)" },
    { value: 3, label: "Médio (3)" },
    { value: 4, label: "Alto (4)" },
    { value: 5, label: "Muito Alto (5)" },
  ];

  return (
    <>
      <style>{selectHoverStyles}</style>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle>Filtrar Conversas</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Filtros para personalizar a lista de conversas
          </DialogDescription>

          <div className="grid gap-6 py-4">
            {/* Can AI Answer filter */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="canAiAnswer" className="text-sm font-medium">
                IA pode responder
              </Label>
              <div 
                className="hover-select-wrapper"
                onMouseEnter={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) {
                    button.style.backgroundColor = '#f9fafb';
                    button.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) {
                    button.style.backgroundColor = '';
                    button.style.borderColor = '';
                  }
                }}
              >
                <Select
                  value={localFilters.canAiAnswer === undefined ? "all" : localFilters.canAiAnswer.toString()}
                  onValueChange={handleBooleanChange("canAiAnswer")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Is Waiting for Response filter */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="isWaitingForResponse" className="text-sm font-medium">
                Aguardando resposta
              </Label>
              <div 
                className="hover-select-wrapper"
                onMouseEnter={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) {
                    button.style.backgroundColor = '#f9fafb';
                    button.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) {
                    button.style.backgroundColor = '';
                    button.style.borderColor = '';
                  }
                }}
              >
                <Select
                  value={localFilters.isWaitingForResponse === undefined ? "all" : localFilters.isWaitingForResponse.toString()}
                  onValueChange={handleBooleanChange("isWaitingForResponse")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Is Active filter */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="isActive" className="text-sm font-medium">
                Chat ativo
              </Label>
              <div 
                className="hover-select-wrapper"
                onMouseEnter={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) {
                    button.style.backgroundColor = '#f9fafb';
                    button.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) {
                    button.style.backgroundColor = '';
                    button.style.borderColor = '';
                  }
                }}
              >
                <Select
                  value={localFilters.isActive === undefined ? "all" : localFilters.isActive.toString()}
                  onValueChange={handleBooleanChange("isActive")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lead Engagements filter with checkboxes */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="leadEngagements" className="text-sm font-medium">
                Nível de engajamento
              </Label>
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="outline"
                  className="w-full justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setIsEngagementDropdownOpen(!isEngagementDropdownOpen)}
                  type="button"
                >
                  {selectedEngagementLevels.length > 0
                    ? `${selectedEngagementLevels.length} selecionado(s)`
                    : "Selecionar níveis"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                
                {isEngagementDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="p-3 space-y-2">
                      {engagementLevelOptions.map((option) => (
                        <div 
                          key={option.value} 
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEngagementLevelChange(option.value, !selectedEngagementLevels.includes(option.value));
                          }}
                        >
                          <Checkbox
                            id={`engagement-${option.value}`}
                            checked={selectedEngagementLevels.includes(option.value)}
                            onCheckedChange={() => {}}
                          />
                          <Label
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                      
                      {selectedEngagementLevels.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEngagementLevels([])}
                            className="w-full text-xs"
                            type="button"
                          >
                            Limpar seleção
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results per page filter */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="take" className="text-sm font-medium">
                Resultados por página
              </Label>
              <div 
                className="hover-select-wrapper"
                onMouseEnter={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) {
                    button.style.backgroundColor = '#f9fafb';
                    button.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget.querySelector('button');
                  if (button) {
                    button.style.backgroundColor = '';
                    button.style.borderColor = '';
                  }
                }}
              >
                <Select
                  value={localFilters.take || "20"}
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, take: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="20" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleResetFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={handleApplyFilters}>Aplicar Filtros</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 