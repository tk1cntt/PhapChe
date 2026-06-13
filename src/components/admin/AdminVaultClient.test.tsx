import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import AdminVaultClient from './AdminVaultClient';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminVaultClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== WHITEBOX TESTS ====================
  describe('Whitebox: Component renders correctly', () => {
    it('renders page header with correct title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [],
          tags: [],
          classifications: [],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Phân loại vault');
      });
    });

    it('renders upload button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [],
          tags: [],
          classifications: [],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        const uploadBtn = screen.getByRole('button', { name: /tải tệp lên/i });
        expect(uploadBtn).toBeInTheDocument();
      });
    });

    it('computes stats from fetched data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [{ id: '1', name: 'Folder 1' }],
          tags: [{ id: '1', key: 'tag1', label: 'Tag 1' }],
          classifications: [
            { vaultFile: { id: '1', filename: 'test.pdf', createdAt: new Date() }, folders: [], tags: [] },
          ],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tổng thư mục')).toBeInTheDocument();
        expect(screen.getByText('Tệp pháp lý')).toBeInTheDocument();
        expect(screen.getByText('Thẻ phân loại')).toBeInTheDocument();
      });
    });
  });

  // ==================== BLACKBOX TESTS ====================
  describe('Blackbox: API integration', () => {
    it('fetches data from /api/vault on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [],
          tags: [],
          classifications: [],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/vault', expect.any(Object));
      });
    });

    it('displays folders from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [
            { id: '1', name: 'Contracts', name_vi: 'Hợp đồng', _count: { vaultFileFolders: 5 } },
          ],
          tags: [],
          classifications: [],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Hợp đồng')).toBeInTheDocument();
        expect(screen.getByText('5 tệp')).toBeInTheDocument();
      });
    });

    it('displays tags from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [],
          tags: [
            { id: '1', key: 'contract', label_vi: 'Hợp đồng', _count: { vaultFileTags: 10 } },
          ],
          classifications: [],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Hợp đồng')).toBeInTheDocument();
        expect(screen.getByText('10 tệp')).toBeInTheDocument();
      });
    });

    it('displays file classifications from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [],
          tags: [],
          classifications: [
            {
              vaultFile: {
                id: '1',
                filename: 'contract.pdf',
                createdAt: '2024-06-13T00:00:00.000Z',
                size: 1024 * 500,
              },
              folders: [],
              tags: [],
            },
          ],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('contract.pdf')).toBeInTheDocument();
      });
    });
  });

  // ==================== ABNORMAL TESTS ====================
  describe('Abnormal: Edge cases', () => {
    it('handles empty API response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [],
          tags: [],
          classifications: [],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Chưa có thư mục nào.')).toBeInTheDocument();
        expect(screen.getByText('Chưa có thẻ nào.')).toBeInTheDocument();
      });
    });

    it('handles undefined/null fields in API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [{ id: '1', name: null }],
          tags: [{ id: '1', key: 'test', label: null }],
          classifications: [
            { vaultFile: { id: '1', filename: null, createdAt: null }, folders: [], tags: [] },
          ],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        // Should not crash and should show default values
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('handles missing _count in folders', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folders: [{ id: '1', name: 'Folder without count' }],
          tags: [],
          classifications: [],
        }),
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('0 tệp')).toBeInTheDocument();
      });
    });
  });

  // ==================== ERROR TESTS ====================
  describe('Error: Error handling', () => {
    it('displays error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByText(/không thể tải dữ liệu vault/i)).toBeInTheDocument();
      });
    });

    it('redirects to sign-in on 403 response', async () => {
      const pushMock = vi.fn();
      vi.mock('next/navigation', () => ({
        useRouter: () => ({
          push: pushMock,
        }),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith('/sign-in');
      });
    });

    it('shows retry button on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        const retryBtn = screen.getByRole('button', { name: /thử lại/i });
        expect(retryBtn).toBeInTheDocument();
      });
    });
  });
});
