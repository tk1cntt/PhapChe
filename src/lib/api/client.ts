/**
 * Central API Client
 * Single client for all API calls - reuse instead of duplicate
 */

import { toastError } from '../toast';

type RequestOptions = {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

type ApiResponse<T> = {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
  };
};

type ErrorResponse = {
  error: string;
  detail?: string;
  field?: string;
};

/**
 * Handle error side-effects (toast, 401 redirect) before re-throwing.
 * Toast calls only execute on client-side (guarded in toast.ts).
 */
function handleError(status: number, error: Error): never {
  if (status === 401 && typeof window !== 'undefined') {
    // Avoid redirect loop if already on login page
    if (!window.location.pathname.startsWith('/login')) {
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnPath)}`;
    }
  } else if (status === 403) {
    toastError('Không có quyền truy cập');
  } else if (status === 500) {
    toastError('Lỗi máy chủ, vui lòng thử lại');
  }
  throw error;
}

/**
 * Central API client class for making HTTP requests
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const maxRetries = 3;
    // True exponential backoff with jitter: 500ms, 1s, 2s
    const retryDelays = [500, 1000, 2000];

    const getRetryDelay = (attempt: number): number => {
      const baseDelay = retryDelays[attempt] || retryDelays[retryDelays.length - 1];
      const jitter = Math.random() * 0.3 * baseDelay; // 0-30% jitter to prevent thundering herd
      return baseDelay + jitter;
    };

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${method} ${url.toString()}`);
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: options?.signal,
          credentials: 'include',
        });

        const data = await response.json() as T | ErrorResponse;

        if (!response.ok) {
          const errorData = data as ErrorResponse;

          // Retry ONLY on HTTP 502/503/504
          if (attempt < maxRetries && [502, 503, 504].includes(response.status)) {
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
            continue;
          }

          const error = new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
          handleError(response.status, error);
        }

        return data as T;
      } catch (error) {
        // Retry on network errors only (TypeError from fetch failure)
        const isNetworkError = error instanceof TypeError && error.message.includes('fetch');

        if (isNetworkError && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
          continue;
        }

        // Re-throw non-API errors (e.g. already-handled errors from handleError)
        throw error;
      }
    }

    throw new Error('Request failed after retries');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

export { ApiClient };
export type { RequestOptions, ApiResponse, ErrorResponse };
