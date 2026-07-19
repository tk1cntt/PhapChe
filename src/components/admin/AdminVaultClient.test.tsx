import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import AdminVaultClient from './AdminVaultClient';

const { pushMock, routerObj } = vi.hoisted(() => {
  const pushMock = vi.fn();
  return {
    pushMock,
    routerObj: { push: pushMock },
  };
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => routerObj,
}));

// Mock next-intl with stable translator functions
const { vaultTranslator, commonTranslator } = vi.hoisted(() => {
  const vault: Record<string, string> = {
    pageTitle: 'Kho tài liệu',
    pageDescription: 'Tạo thư mục và thẻ để tổ chức hồ sơ pháp lý, phân quyền truy cập và theo dõi tài liệu an toàn.',
    uploadFile: 'Tải tệp lên',
    statTotalFiles: 'Tệp pháp lý',
    statTotalFilesDesc: 'Đã phân loại',
    statTotalFolders: 'Tổng thư mục',
    statTotalFoldersDesc: 'Theo workspace',
    statTotalTags: 'Thẻ phân loại',
    statTotalTagsDesc: 'Contract, NDA, Compliance...',
    statSecurity: 'Bảo mật',
    statSecurityDesc: 'Có workspace scope',
    folders: 'Thư mục',
    tags: 'Thẻ phân loại',
    noFolders: 'Chưa có thư mục nào.',
    noTags: 'Chưa có thẻ nào.',
    files: 'tệp',
  };
  const common: Record<string, string> = {
    error: 'Đã xảy ra lỗi.',
    retry: 'Thử lại',
  };
  return {
    vaultTranslator: (key: string) => vault[key] ?? key,
    commonTranslator: (key: string) => common[key] ?? key,
  };
});

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    return ns === 'Vault' ? vaultTranslator : ns === 'Common' ? commonTranslator : (key: string) => key;
  },
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
      mockFetch.mockResolvedValue({
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
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kho tài liệu');
      });
    });

    it('renders upload button', async () => {
      mockFetch.mockResolvedValue({
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
      const statsData = {
        folders: [{ id: '1', name: 'Folder 1' }],
        tags: [{ id: '1', key: 'tag1', label: 'Tag 1' }],
        classifications: [
          { vaultFile: { id: '1', filename: 'test.pdf', createdAt: new Date() }, folders: [], tags: [] },
        ],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => statsData,
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        // statTotalFolders = "Tổng thư mục" and statTotalFiles = "Tệp pháp lý"
        // statTotalTags = "Thẻ phân loại" overlaps with tags key, use getAllByText
        expect(screen.getByText('Tổng thư mục')).toBeInTheDocument();
        expect(screen.getByText('Tệp pháp lý')).toBeInTheDocument();
        const tagElements = screen.getAllByText('Thẻ phân loại');
        expect(tagElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==================== BLACKBOX TESTS ====================
  describe('Blackbox: API integration', () => {
    it('fetches data from /api/vault on mount', async () => {
      mockFetch.mockResolvedValue({
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          folders: [
            { id: '1', name: 'Hợp đồng', _count: { vaultFileFolders: 5 } },
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          folders: [],
          tags: [
            { id: '1', key: 'contract', label: 'Hợp đồng', _count: { vaultFileTags: 10 } },
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
      mockFetch.mockResolvedValue({
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
      mockFetch.mockResolvedValue({
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
      mockFetch.mockResolvedValue({
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
      mockFetch.mockResolvedValue({
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
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<AdminVaultClient />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch vault data/i)).toBeInTheDocument();
      });
    });

    it('redirects to sign-in on 403 response', async () => {
      mockFetch.mockResolvedValue({
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
      mockFetch.mockResolvedValue({
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
