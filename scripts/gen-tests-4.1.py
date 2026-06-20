#!/usr/bin/env python3
"""Generate test files for Plan 73-04."""
import pathlib

# Task 4.1: API client retry tests
pathlib.Path('D:/PhapChe/src/lib/api/client.test.ts').write_text(r"""import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from './client';

describe('API Client - Retry Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('Network Error Retry', () => {
    it('should retry on network error (Failed to fetch) and succeed on third attempt', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
        } as Response);

      const promise = apiClient.get('/test');
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry exactly 3 times on persistent network errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const promise = apiClient.get('/test');
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).rejects.toThrow('Failed to fetch');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('HTTP 5xx Retry', () => {
    it('should retry on 502 Bad Gateway and succeed', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          json: async () => ({ error: 'Bad Gateway' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
        } as Response);

      const promise = apiClient.get('/test');
      await vi.advanceTimersByTimeAsync(500);

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on 503 Service Unavailable and succeed', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: 'Service Unavailable' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
        } as Response);

      const promise = apiClient.get('/test');
      await vi.advanceTimersByTimeAsync(500);

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on 504 Gateway Timeout and succeed', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 504,
          json: async () => ({ error: 'Gateway Timeout' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
        } as Response);

      const promise = apiClient.get('/test');
      await vi.advanceTimersByTimeAsync(500);

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should fail after 3 retries on persistent 502 errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: 'Bad Gateway' }),
      } as Response);

      const promise = apiClient.get('/test');
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).rejects.toThrow('Bad Gateway');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('HTTP 4xx No Retry', () => {
    it('should NOT retry on 400 Bad Request', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad Request' }),
      } as Response);

      const promise = apiClient.get('/test');
      await expect(promise).rejects.toThrow('Bad Request');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on 401 Unauthorized', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      const promise = apiClient.get('/test');
      await expect(promise).rejects.toThrow('Unauthorized');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on 403 Forbidden', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      } as Response);

      const promise = apiClient.get('/test');
      await expect(promise).rejects.toThrow('Forbidden');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on 404 Not Found', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not Found' }),
      } as Response);

      const promise = apiClient.get('/test');
      await expect(promise).rejects.toThrow('Not Found');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on 500 Internal Server Error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      } as Response);

      const promise = apiClient.get('/test');
      await expect(promise).rejects.toThrow('Internal Server Error');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Exponential Backoff Timing', () => {
    it('should apply exponential backoff delays: 500ms, 1000ms, 2000ms', async () => {
      const mockFetch = vi.mocked(fetch);
      const fetchTimes: number[] = [];

      mockFetch.mockImplementation(async () => {
        fetchTimes.push(Date.now());
        throw new TypeError('Failed to fetch');
      });

      const promise = apiClient.get('/test');
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).rejects.toThrow('Failed to fetch');

      expect(fetchTimes).toHaveLength(4);
      expect(fetchTimes[1] - fetchTimes[0]).toBe(500);
      expect(fetchTimes[2] - fetchTimes[1]).toBe(1000);
      expect(fetchTimes[3] - fetchTimes[2]).toBe(2000);
    });
  });

  describe('HTTP Methods', () => {
    it('should work with GET method', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'get' }),
      } as Response);

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual({ data: 'get' });
    });

    it('should work with POST method', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'post' }),
      } as Response);

      const result = await apiClient.post('/test', { foo: 'bar' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ foo: 'bar' }),
        })
      );
      expect(result).toEqual({ data: 'post' });
    });

    it('should work with PUT method', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'put' }),
      } as Response);

      const result = await apiClient.put('/test', { foo: 'bar' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ foo: 'bar' }),
        })
      );
      expect(result).toEqual({ data: 'put' });
    });

    it('should work with PATCH method', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'patch' }),
      } as Response);

      const result = await apiClient.patch('/test', { foo: 'bar' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ foo: 'bar' }),
        })
      );
      expect(result).toEqual({ data: 'patch' });
    });

    it('should work with DELETE method', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'delete' }),
      } as Response);

      const result = await apiClient.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({ data: 'delete' });
    });
  });
});
""", encoding='utf-8')

# Task 4.2a: Toast integration tests (append to client.test.ts)
pathlib.Path('D:/PhapChe/src/lib/api/toast-integration.test.ts').write_text(r"""import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../toast', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import { ApiClient } from './client';
import { toastError } from '../toast';

describe('API Client - Toast Notifications', () => {
  let client: InstanceType<typeof ApiClient>;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
    // Use a fresh client with empty base URL for tests
    client = new ApiClient('http://localhost');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should show toast on HTTP 500 with correct message', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    } as Response);

    await expect(client.get('/api/test')).rejects.toThrow();

    expect(toastError).toHaveBeenCalledWith('Lỗi máy chủ, vui lòng thử lại');
  });

  it('should show toast on HTTP 403 with correct message', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    } as Response);

    await expect(client.get('/api/test')).rejects.toThrow();

    expect(toastError).toHaveBeenCalledWith('Không có quyền truy cập');
  });

  it('should NOT show toast on successful response (200)', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'success' }),
    } as Response);

    await client.get('/api/test');

    expect(toastError).not.toHaveBeenCalled();
  });

  it('should redirect to /login on 401 when window is available', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    // window.location.href setter spy
    const hrefSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
      writable: true,
    });

    await expect(client.get('/api/test')).rejects.toThrow();

    expect(window.location.href).toBe('/login');

    // Restore
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
      writable: true,
    });
  });
});
""", encoding='utf-8')

# Task 4.2b: Toast wrapper tests
pathlib.Path('D:/PhapChe/src/lib/toast.test.ts').write_text(r"""import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    __call: vi.fn(),
  },
}));

import toast from 'react-hot-toast';
import { toastSuccess, toastError, toastInfo, toastWarning } from './toast';

describe('Toast Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toastSuccess calls toast.success with message', () => {
    toastSuccess('Thành công');
    expect(toast.success).toHaveBeenCalledWith('Thành công');
  });

  it('toastError calls toast.error with message', () => {
    toastError('Lỗi xảy ra');
    expect(toast.error).toHaveBeenCalledWith('Lỗi xảy ra');
  });

  it('toastInfo calls toast with message', () => {
    toastInfo('Thông tin');
    expect(toast).toHaveBeenCalledWith('Thông tin');
  });

  it('toastWarning calls toast with message and warning icon', () => {
    toastWarning('Cảnh báo');
    expect(toast).toHaveBeenCalledWith('Cảnh báo', { icon: '⚠️' });
  });
});
""", encoding='utf-8')

# Task 4.3a: React Query setup tests
pathlib.Path('D:/PhapChe/src/lib/react-query.test.tsx').write_text(r"""import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

import { queryClient, QueryProvider } from './react-query';

describe('React Query Setup', () => {
  describe('QueryClient configuration', () => {
    it('queryClient exists', () => {
      expect(queryClient).toBeDefined();
    });

    it('staleTime is 5 minutes (300000ms)', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
    });

    it('gcTime is 30 minutes (1800000ms)', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.gcTime).toBe(30 * 60 * 1000);
    });

    it('retry is 3', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.retry).toBe(3);
    });

    it('refetchOnWindowFocus is false', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    });
  });

  describe('QueryProvider', () => {
    it('renders children', () => {
      render(
        <QueryProvider>
          <div data-testid="child">Hello</div>
        </QueryProvider>
      );
      expect(screen.getByTestId('child')).toBeDefined();
    });

    it('provides QueryClient to children via useQueryClient', () => {
      function TestComponent() {
        const client = useQueryClient();
        return <div data-testid="has-client">{client ? 'yes' : 'no'}</div>;
      }

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );

      expect(screen.getByTestId('has-client').textContent).toBe('yes');
    });
  });
});
""", encoding='utf-8')

# Task 4.3b: Query keys tests
pathlib.Path('D:/PhapChe/src/lib/query-keys.test.ts').write_text(r"""import { describe, it, expect } from 'vitest';
import { queryKeys } from './query-keys';

describe('Query Key Factories', () => {
  const domains = ['users', 'requests', 'workspaces', 'auditEvents', 'vaultFiles', 'messages'] as const;

  domains.forEach((domain) => {
    describe(`${domain} domain`, () => {
      const keys = queryKeys[domain];

      it('.all returns [entity]', () => {
        expect(keys.all).toEqual([domain]);
      });

      it('.lists() returns [entity, "list"]', () => {
        expect(keys.lists()).toEqual([domain, 'list']);
      });

      it('.list() without filters returns [entity, "list"]', () => {
        expect(keys.list()).toEqual([domain, 'list']);
      });

      it('.list(filters) includes filters object', () => {
        const filters = { page: 1, status: 'active' };
        expect(keys.list(filters)).toEqual([domain, 'list', filters]);
      });

      it('.details() returns [entity, "detail"]', () => {
        expect(keys.details()).toEqual([domain, 'detail']);
      });

      it('.detail(id) returns [entity, "detail", id]', () => {
        expect(keys.detail('123')).toEqual([domain, 'detail', '123']);
      });

      it('.detail with different ids produces different keys', () => {
        expect(keys.detail('abc')).not.toEqual(keys.detail('xyz'));
      });
    });
  });

  it('filters object is passed by reference (not cloned)', () => {
    const filters = { page: 1 };
    const key = queryKeys.users.list(filters);
    expect(key[2]).toBe(filters);
  });
});
""", encoding='utf-8')

print('Tasks 4.1-4.3 files created.')
