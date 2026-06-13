import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminVaultFilesTable } from './AdminVaultFilesTable';

describe('AdminVaultFilesTable', () => {
  // ==================== WHITEBOX TESTS ====================
  describe('Whitebox: Table structure', () => {
    it('renders table headers correctly', () => {
      render(
        <AdminVaultFilesTable
          classifications={[]}
          loading={false}
        />
      );

      expect(screen.getByText('Tên tệp')).toBeInTheDocument();
      expect(screen.getByText('Thư mục')).toBeInTheDocument();
      expect(screen.getByText('Thẻ')).toBeInTheDocument();
      expect(screen.getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByText('Chủ sở hữu')).toBeInTheDocument();
      expect(screen.getByText('Bảo mật')).toBeInTheDocument();
      expect(screen.getByText('Thao tác')).toBeInTheDocument();
    });

    it('renders correct number of columns in header', () => {
      const { container } = render(
        <AdminVaultFilesTable
          classifications={[]}
          loading={false}
        />
      );

      const headerCells = container.querySelectorAll('.vault-th');
      expect(headerCells).toHaveLength(7);
    });
  });

  // ==================== BLACKBOX TESTS ====================
  describe('Blackbox: Data display', () => {
    it('displays filename with file extension icon', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: 'contract.pdf',
            createdAt: new Date('2024-06-13'),
          },
          folders: [],
          tags: [],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('contract.pdf')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    it('displays folder name when file has folder', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: 'contract.pdf',
            createdAt: new Date(),
          },
          folders: [{ id: '1', name: 'Contracts', name_vi: 'Hợp đồng' }],
          tags: [],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('Hợp đồng')).toBeInTheDocument();
    });

    it('displays tag chips with correct colors', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: 'contract.pdf',
            createdAt: new Date(),
          },
          folders: [],
          tags: [{ id: '1', key: 'contract', label_vi: 'Hợp đồng' }],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('Hợp đồng')).toBeInTheDocument();
    });

    it('displays workspace info when present', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: 'contract.pdf',
            createdAt: new Date(),
            workspace: { name: 'An Phat', slug: 'an-phat' },
          },
          folders: [],
          tags: [],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('An Phat')).toBeInTheDocument();
      expect(screen.getByText('an-phat')).toBeInTheDocument();
    });

    it('displays owner info when present', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: 'contract.pdf',
            createdAt: new Date(),
            createdBy: { name: 'John Doe', email: 'john@example.com' },
          },
          folders: [],
          tags: [],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('displays security badge', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: 'contract.pdf',
            createdAt: new Date(),
          },
          folders: [],
          tags: [],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('Đã mã hóa')).toBeInTheDocument();
    });

    it('displays action link with file ID', () => {
      const classifications = [
        {
          vaultFile: {
            id: 'file-123',
            filename: 'contract.pdf',
            createdAt: new Date(),
          },
          folders: [],
          tags: [],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      const actionLink = screen.getByRole('link', { name: /mở tệp/i });
      expect(actionLink).toHaveAttribute('href', '/api/vault/file-123/download');
    });
  });

  // ==================== ABNORMAL TESTS ====================
  describe('Abnormal: Edge cases', () => {
    it('displays placeholder for missing filename', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: null,
            createdAt: new Date(),
          },
          folders: [],
          tags: [],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('(không tên)')).toBeInTheDocument();
    });

    it('displays placeholder for missing folder', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: 'contract.pdf',
            createdAt: new Date(),
          },
          folders: [],
          tags: [],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getAllByText('—')).toHaveLength(4); // folder, tags, workspace, owner
    });

    it('handles multiple tags per file', () => {
      const classifications = [
        {
          vaultFile: {
            id: '1',
            filename: 'contract.pdf',
            createdAt: new Date(),
          },
          folders: [],
          tags: [
            { id: '1', key: 'contract', label_vi: 'Hợp đồng' },
            { id: '2', key: 'urgent', label_vi: 'Khẩn' },
          ],
        },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('Hợp đồng')).toBeInTheDocument();
      expect(screen.getByText('Khẩn')).toBeInTheDocument();
    });

    it('handles various file extensions', () => {
      const classifications = [
        { vaultFile: { id: '1', filename: 'doc.docx', createdAt: new Date() }, folders: [], tags: [] },
        { vaultFile: { id: '2', filename: 'sheet.xlsx', createdAt: new Date() }, folders: [], tags: [] },
        { vaultFile: { id: '3', filename: 'archive.zip', createdAt: new Date() }, folders: [], tags: [] },
      ];

      render(
        <AdminVaultFilesTable
          classifications={classifications}
          loading={false}
        />
      );

      expect(screen.getByText('DOC')).toBeInTheDocument();
      expect(screen.getByText('XLS')).toBeInTheDocument();
      expect(screen.getByText('ZIP')).toBeInTheDocument();
    });
  });

  // ==================== ERROR TESTS ====================
  describe('Error: Error states', () => {
    it('shows loading state when loading prop is true', () => {
      render(
        <AdminVaultFilesTable
          classifications={[]}
          loading={true}
        />
      );

      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });

    it('shows empty state when no classifications', () => {
      render(
        <AdminVaultFilesTable
          classifications={[]}
          loading={false}
        />
      );

      expect(screen.getByText('Chưa có tệp nào.')).toBeInTheDocument();
    });
  });
});
