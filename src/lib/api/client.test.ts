import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from './client';

describe('API Client - Retry Logic', () => {
  let client: InstanceType<typeof ApiClient>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
    client = new ApiClient('http://localhost');
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

      const promise = client.get('/test');
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry exactly 3 times on persistent network errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const promise = client.get('/test');
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).rejects.toThrow('Failed to fetch');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('HTTP 502/503/504 Retry', () => {
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const promise = client.get('/test');
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

      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/test',
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

      const result = await client.post('/test', { foo: 'bar' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/test',
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

      const result = await client.put('/test', { foo: 'bar' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/test',
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

      const result = await client.patch('/test', { foo: 'bar' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/test',
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

      const result = await client.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/test',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({ data: 'delete' });
    });
  });
});
