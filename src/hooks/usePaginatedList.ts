import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/axios';
import type { Paginated } from '../types/api';

interface Options {
  endpoint: string;
  initialLimit?: number;
}

export function usePaginatedList<T>({ endpoint, initialLimit = 20 }: Options) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<Paginated<T>>(endpoint, {
        params: { page, limit, search, ...filters },
      });
      setData(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, limit, search, filters]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    data,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilters,
    loading,
    error,
    refetch: fetchData,
  };
}