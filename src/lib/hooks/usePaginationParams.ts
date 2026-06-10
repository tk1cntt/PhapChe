'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface PaginationParams {
  page: number;
  pageSize: number;
  search: string;
  filters: Record<string, string>;
}

export interface PaginationActions {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (term: string) => void;
  setFilter: (key: string, value: string | null) => void;
  clearFilters: () => void;
  clearSearch: () => void;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Hook for syncing pagination and search state with URL query params.
 * Satisfies PAGE-02: Page state synced to URL, SCH-04: Search state persisted in URL.
 */
export function usePaginationParams(defaultPageSize: number = DEFAULT_PAGE_SIZE): PaginationParams & PaginationActions {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current values from URL
  const page = useMemo(() => {
    const pageParam = searchParams.get('page');
    const parsed = parseInt(pageParam ?? '1', 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const sizeParam = searchParams.get('pageSize');
    const parsed = parseInt(sizeParam ?? String(defaultPageSize), 10);
    if (isNaN(parsed) || parsed < 1) return defaultPageSize;
    return Math.min(parsed, MAX_PAGE_SIZE); // Mitigate T-25-01: Enforce max pageSize
  }, [searchParams, defaultPageSize]);

  const search = useMemo(() => {
    return searchParams.get('search') ?? '';
  }, [searchParams]);

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        result[key.substring(7)] = value; // Remove 'filter_' prefix
      }
    });
    return result;
  }, [searchParams]);

  // Build URL with updated params
  const buildUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  const setPage = useCallback((newPage: number) => {
    const url = buildUrl({ page: String(newPage) });
    router.push(url);
  }, [buildUrl, router]);

  const setPageSize = useCallback((size: number) => {
    const url = buildUrl({
      pageSize: String(size),
      page: '1', // Reset to first page when changing page size
    });
    router.push(url);
  }, [buildUrl, router]);

  const setSearch = useCallback((term: string) => {
    const url = buildUrl({
      search: term,
      page: '1', // Reset to first page on new search
    });
    router.push(url);
  }, [buildUrl, router]);

  const setFilter = useCallback((key: string, value: string | null) => {
    const filterKey = `filter_${key}`;
    const url = buildUrl({ [filterKey]: value, page: '1' });
    router.push(url);
  }, [buildUrl, router]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    // Keep only page and pageSize
    params.set('page', '1');
    if (pageSize !== defaultPageSize) {
      params.set('pageSize', String(pageSize));
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [buildUrl, router, pathname, pageSize, defaultPageSize]);

  const clearSearch = useCallback(() => {
    const url = buildUrl({ search: null, page: '1' });
    router.push(url);
  }, [buildUrl, router]);

  return {
    page,
    pageSize,
    search,
    filters,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    clearFilters,
    clearSearch,
  };
}
