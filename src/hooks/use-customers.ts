import { Customer, CustomersFilters, customersService, PaginationInfo } from '@/services/customers';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  pagination: PaginationInfo | null;
  filters: CustomersFilters;
  setFilters: (filters: CustomersFilters) => void;
  loadMore: () => void;
  refresh: () => void;
  createCustomer: (customerData: {
    name: string;
    phoneNumber: string;
    department?: string;
  }) => Promise<Customer>;
}

export const useCustomers = (clinicId: string): UseCustomersReturn => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState<CustomersFilters>({
    page: 1,
    perPage: 20
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const currentFilters = useRef<CustomersFilters>(filters);
  const filtersChangedRef = useRef(false);

  const fetchCustomers = useCallback(async (isLoadMore = false) => {
    if (!clinicId) return;

    // Previne múltiplas chamadas simultâneas de loadMore
    if (isLoadMore && (loading || isLoadingMore)) return;

    try {
      setLoading(true);
      if (isLoadMore) setIsLoadingMore(true);
      setError(null);

      const currentPage = isLoadMore ? (currentFilters.current.page || 1) + 1 : 1;
      const requestFilters = {
        ...currentFilters.current,
        page: currentPage
      };

      const response = await customersService.getCustomers(clinicId, requestFilters);

      if (isLoadMore) {
        // Deduplica os dados antes de adicionar para evitar chaves duplicadas
        setCustomers(prev => {
          const existingIds = new Set(prev.map(customer => customer.id));
          const newCustomers = response.customers.filter(customer => !existingIds.has(customer.id));
          return [...prev, ...newCustomers];
        });
      } else {
        setCustomers(response.customers);
      }

      setPagination(response.pagination || null);
      
      // Atualiza hasMore baseado na paginação
      if (response.pagination) {
        setHasMore(currentPage < response.pagination.totalPages);
        currentFilters.current = { ...requestFilters, page: currentPage };
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
      setError('Erro ao carregar contatos');
    } finally {
      setLoading(false);
      if (isLoadMore) setIsLoadingMore(false);
    }
  }, [clinicId]);

  const loadMore = useCallback(() => {
    if (!loading && !isLoadingMore && hasMore) {
      fetchCustomers(true);
    }
  }, [fetchCustomers, loading, isLoadingMore, hasMore]);

  const refresh = useCallback(() => {
    currentFilters.current = { ...currentFilters.current, page: 1 };
    setHasMore(true);
    setCustomers([]);
    fetchCustomers(false);
  }, [fetchCustomers]);

  const updateFilters = useCallback((newFilters: CustomersFilters) => {
    setFilters(newFilters);
    currentFilters.current = { ...newFilters, page: 1 };
    setHasMore(true);
    setCustomers([]);
    filtersChangedRef.current = true;
  }, []);

  // Carregamento inicial apenas uma vez
  useEffect(() => {
    if (isInitialLoad && clinicId) {
      setIsInitialLoad(false);
      currentFilters.current = { ...filters, page: 1 };
      fetchCustomers(false);
    }
  }, [clinicId, isInitialLoad, fetchCustomers, filters]);

  // Recarrega apenas quando os filtros mudam efetivamente
  useEffect(() => {
    if (filtersChangedRef.current && !isInitialLoad) {
      filtersChangedRef.current = false;
      fetchCustomers(false);
    }
  }, [filters, isInitialLoad, fetchCustomers]);

  return {
    customers,
    loading,
    error,
    hasMore,
    pagination,
    filters,
    setFilters: updateFilters,
    loadMore,
    refresh,
    createCustomer: useCallback(async (customerData: {
      name: string;
      phoneNumber: string;
      department?: string;
    }) => {
      try {
        const newCustomer = await customersService.createCustomer(clinicId, customerData);
        console.log('Contato criado no backend:', newCustomer);
        return newCustomer;
      } catch (error) {
        console.error('Erro na criação do contato:', error);
        throw error;
      }
    }, [clinicId])
  };
}; 