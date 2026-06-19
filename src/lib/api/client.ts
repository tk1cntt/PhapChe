/**
 * Central API Client
 * Single client for all API calls - reuse instead of duplicate
 */

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
    const retryDelays = [500, 1000, 2000]; // Exponential backoff: 500ms, 1s, 2s

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
            await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
            continue;
          }

          throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
        }

        return data as T;
      } catch (error) {
        // Retry on network errors only (TypeError from fetch failure)
        const isNetworkError = error instanceof TypeError && error.message.includes('fetch');

        if (isNetworkError && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
          continue;
        }

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
