import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/vi/admin/dashboard',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock next-intl
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: (ns: string) => {
      const messages: Record<string, Record<string, string>> = {
        AdminNav: {
          dashboard: 'Dashboard',
          requests: 'Hồ sơ yêu cầu',
          users: 'Người dùng',
          workspaces: 'Workspace',
          partner: 'Partner',
          organizations: 'Organizations',
          ops: 'Vận hành',
          audit: 'Audit',
          vault: 'Kho tài liệu',
          'helpCard.needHelp': 'Cần hỗ trợ?',
          'helpCard.viewGuide': 'Xem tài liệu →',
        },
        Common: {
          signOut: 'Đăng xuất',
        },
      };
      return (key: string) => {
        if (ns === 'AdminNav') return messages.AdminNav[key] ?? key;
        if (ns === 'Common') return messages.Common[key] ?? key;
        return key;
      };
    },
    useLocale: () => 'vi',
  };
});

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  signOut: vi.fn(),
}));

// Mock DropdownMenu
vi.mock('@/components/shared/ui/DropdownMenu', () => ({
  DropdownMenu: ({ children, items }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
}));

// Create a wrapper with IntlProvider
function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="vi" messages={{}}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('AdminLayout — Sidebar role visibility', () => {
  // ── Whitebox tests ──
  describe('whitebox: role filtering logic', () => {
    it('renders all menu items for super_admin', () => {
      renderWithIntl(
        <AdminLayout userRoles={['super_admin']}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ yêu cầu')).toBeInTheDocument();
      expect(screen.getByText('Người dùng')).toBeInTheDocument();
      expect(screen.getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByText('Partner')).toBeInTheDocument();
      expect(screen.getByText('Organizations')).toBeInTheDocument();
      expect(screen.getByText('Vận hành')).toBeInTheDocument();
      expect(screen.getByText('Audit')).toBeInTheDocument();
      expect(screen.getByText('Kho tài liệu')).toBeInTheDocument();
    });

    it('renders coordinator menu items', () => {
      renderWithIntl(
        <AdminLayout userRoles={['coordinator_admin']}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ yêu cầu')).toBeInTheDocument();
      expect(screen.getByText('Người dùng')).toBeInTheDocument();
      expect(screen.getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByText('Partner')).toBeInTheDocument();
      expect(screen.getByText('Vận hành')).toBeInTheDocument();
      expect(screen.getByText('Audit')).toBeInTheDocument();
      expect(screen.getByText('Kho tài liệu')).toBeInTheDocument();
      // coordinator cannot see organizations
      expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
    });

    it('renders specialist menu items', () => {
      renderWithIntl(
        <AdminLayout userRoles={['specialist']}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ yêu cầu')).toBeInTheDocument();
      expect(screen.getByText('Partner')).toBeInTheDocument();
      expect(screen.getByText('Kho tài liệu')).toBeInTheDocument();
      // specialist CANNOT see these
      expect(screen.queryByText('Người dùng')).not.toBeInTheDocument();
      expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
      expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
      expect(screen.queryByText('Vận hành')).not.toBeInTheDocument();
      expect(screen.queryByText('Audit')).not.toBeInTheDocument();
    });

    it('renders reviewer menu items', () => {
      renderWithIntl(
        <AdminLayout userRoles={['reviewer']}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ yêu cầu')).toBeInTheDocument();
      expect(screen.getByText('Partner')).toBeInTheDocument();
      expect(screen.getByText('Kho tài liệu')).toBeInTheDocument();
      expect(screen.queryByText('Người dùng')).not.toBeInTheDocument();
      expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
      expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
      expect(screen.queryByText('Vận hành')).not.toBeInTheDocument();
      expect(screen.queryByText('Audit')).not.toBeInTheDocument();
    });

    it('renders audit_admin menu items', () => {
      renderWithIntl(
        <AdminLayout userRoles={['audit_admin']}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Audit')).toBeInTheDocument();
      // audit_admin CANNOT see these
      expect(screen.queryByText('Hồ sơ yêu cầu')).not.toBeInTheDocument();
      expect(screen.queryByText('Người dùng')).not.toBeInTheDocument();
      expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
      expect(screen.queryByText('Partner')).not.toBeInTheDocument();
      expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
    });
  });

  // ── Blackbox tests ──
  describe('blackbox: dashboard always visible', () => {
    it('renders dashboard for empty roles', () => {
      renderWithIntl(
        <AdminLayout userRoles={[]}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders only dashboard for customer role', () => {
      renderWithIntl(
        <AdminLayout userRoles={['customer']}>
          <div>content</div>
        </AdminLayout>
      );
      // Dashboard is null=always visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      // All others hidden
      expect(screen.queryByText('Hồ sơ yêu cầu')).not.toBeInTheDocument();
      expect(screen.queryByText('Người dùng')).not.toBeInTheDocument();
    });
  });

  // ── Abnormal tests ──
  describe('abnormal: edge cases', () => {
    it('handles undefined userRoles gracefully', () => {
      renderWithIntl(
        <AdminLayout>
          <div>content</div>
        </AdminLayout>
      );
      // Dashboard should still show (null = always visible)
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles null userRoles gracefully', () => {
      renderWithIntl(
        <AdminLayout userRoles={null as any}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders children regardless of roles', () => {
      renderWithIntl(
        <AdminLayout userRoles={[]}>
          <div data-testid="child">Test Content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('multi-role user sees combined menu items', () => {
      renderWithIntl(
        <AdminLayout userRoles={['specialist', 'reviewer']}>
          <div>content</div>
        </AdminLayout>
      );
      // Both specialist and reviewer see these
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ yêu cầu')).toBeInTheDocument();
      expect(screen.getByText('Partner')).toBeInTheDocument();
      expect(screen.getByText('Kho tài liệu')).toBeInTheDocument();
      // Neither sees these
      expect(screen.queryByText('Người dùng')).not.toBeInTheDocument();
      expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
    });
  });

  // ── Error tests ──
  describe('error: invalid inputs', () => {
    it('handles unknown role strings without crashing', () => {
      // Should not crash with unknown roles
      renderWithIntl(
        <AdminLayout userRoles={['some_future_role']}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles mixed valid and invalid roles', () => {
      renderWithIntl(
        <AdminLayout userRoles={['specialist', 'invalid_role']}>
          <div>content</div>
        </AdminLayout>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ yêu cầu')).toBeInTheDocument();
      expect(screen.queryByText('Người dùng')).not.toBeInTheDocument();
    });
  });
});
