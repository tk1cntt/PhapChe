/**
 * AdminRequestsPage tests — tab visibility per role
 *
 * Verifies:
 * - AdminRoleContext provides roles from server layout
 * - Tab visibility matches role-config.ts
 * - Loading/empty states
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdminRoleProvider } from '@/lib/security/AdminRoleContext';
import { canSeeTab } from '@/lib/security/role-config';
import { TAB_VISIBILITY } from '@/lib/security/role-config';

// Mock dynamic imports
vi.mock('@/components/admin/TriagePanel', () => ({
  TriagePanel: () => <div data-testid="triage-panel">TriagePanel</div>,
}));

vi.mock('@/components/admin/SpecialistWorkbench', () => ({
  SpecialistWorkbench: () => <div data-testid="specialist-workbench">SpecialistWorkbench</div>,
}));

vi.mock('@/components/admin/ReviewConsole', () => ({
  ReviewConsole: () => <div data-testid="review-console">ReviewConsole</div>,
}));

vi.mock('@/components/admin/DeliveryConsole', () => ({
  DeliveryConsole: () => <div data-testid="delivery-console">DeliveryConsole</div>,
}));

vi.mock('@/components/admin/AdminRequestsClient', () => ({
  default: () => <div data-testid="admin-requests-client">AdminRequestsClient</div>,
}));

vi.mock('@/styles/pages/admin/triage.css', () => ({}));

// ============================================================
// Import the actual page component (after mocks)
// ============================================================
import AdminRequestsPage from '../page';

// ============================================================
// Whitebox tests — context, canSeeTab, tab logic
// ============================================================

describe('AdminRequestsPage — whitebox', () => {
  it('TAB_VISIBILITY triage is only for super_admin and coordinator_admin', () => {
    expect(TAB_VISIBILITY.triage).toEqual(['super_admin', 'coordinator_admin']);
  });

  it('TAB_VISIBILITY workbench includes specialist', () => {
    expect(TAB_VISIBILITY.workbench).toContain('specialist');
  });

  it('TAB_VISIBILITY review includes reviewer', () => {
    expect(TAB_VISIBILITY.review).toContain('reviewer');
  });

  it('canSeeTab returns true for specialist on workbench tab', () => {
    expect(canSeeTab('workbench', ['specialist'])).toBe(true);
  });

  it('canSeeTab returns false for specialist on triage tab', () => {
    expect(canSeeTab('triage', ['specialist'])).toBe(false);
  });

  it('canSeeTab returns false for specialist on delivery tab', () => {
    expect(canSeeTab('delivery', ['specialist'])).toBe(false);
  });

  it('canSeeTab returns false for specialist on review tab', () => {
    expect(canSeeTab('review', ['specialist'])).toBe(false);
  });

  it('canSeeTab returns false for specialist on all tab (super_admin/coordinator only)', () => {
    expect(canSeeTab('all', ['specialist'])).toBe(false);
  });

  it('all tabs visible for super_admin', () => {
    const tabs = ['triage', 'workbench', 'review', 'delivery', 'all'];
    tabs.forEach(t => expect(canSeeTab(t, ['super_admin'])).toBe(true));
  });

  it('all tabs visible for coordinator_admin', () => {
    const tabs = ['triage', 'workbench', 'review', 'delivery', 'all'];
    tabs.forEach(t => expect(canSeeTab(t, ['coordinator_admin'])).toBe(true));
  });
});

// ============================================================
// Blackbox tests — full component behavior
// ============================================================

describe('AdminRequestsPage — blackbox', () => {
  it('renders loading state when roles are empty', () => {
    render(
      <AdminRoleProvider roles={[]}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('specialist sees workbench tab and NOT triage tab', () => {
    render(
      <AdminRoleProvider roles={['specialist']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    // Workbench tab visible
    expect(screen.getByText('🔧 Đang xử lý')).toBeInTheDocument();
    // Triage tab NOT visible
    expect(screen.queryByText('📋 Phân loại & Gán')).not.toBeInTheDocument();
    // Delivery tab NOT visible
    expect(screen.queryByText('📦 Bàn giao')).not.toBeInTheDocument();
  });

  it('specialist lands on workbench tab by default', () => {
    render(
      <AdminRoleProvider roles={['specialist']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    expect(screen.getByTestId('specialist-workbench')).toBeInTheDocument();
  });

  it('coordinator sees all tabs', () => {
    render(
      <AdminRoleProvider roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    expect(screen.getByText('📋 Phân loại & Gán')).toBeInTheDocument();
    expect(screen.getByText('🔧 Đang xử lý')).toBeInTheDocument();
    expect(screen.getByText('✅ Kiểm duyệt')).toBeInTheDocument();
    expect(screen.getByText('📦 Bàn giao')).toBeInTheDocument();
    expect(screen.getByText('📊 Tất cả hồ sơ')).toBeInTheDocument();
  });

  it('coordinator lands on triage tab by default', () => {
    render(
      <AdminRoleProvider roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    expect(screen.getByTestId('triage-panel')).toBeInTheDocument();
  });

  it('reviewer sees review tab and NOT triage tab', () => {
    render(
      <AdminRoleProvider roles={['reviewer']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    expect(screen.getByText('✅ Kiểm duyệt')).toBeInTheDocument();
    expect(screen.queryByText('📋 Phân loại & Gán')).not.toBeInTheDocument();
  });

  it('reviewer lands on review tab by default', () => {
    render(
      <AdminRoleProvider roles={['reviewer']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    expect(screen.getByTestId('review-console')).toBeInTheDocument();
  });

  it('user can switch tabs by clicking', () => {
    render(
      <AdminRoleProvider roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    // Default: triage
    expect(screen.getByTestId('triage-panel')).toBeInTheDocument();
    // Click workbench
    fireEvent.click(screen.getByText('🔧 Đang xử lý'));
    expect(screen.getByTestId('specialist-workbench')).toBeInTheDocument();
  });
});

// ============================================================
// Abnormal tests — edge cases
// ============================================================

describe('AdminRequestsPage — abnormal', () => {
  it('renders "no access" message when user has no admin roles', () => {
    render(
      <AdminRoleProvider roles={['customer']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    expect(screen.getByText('Bạn không có quyền truy cập trang này.')).toBeInTheDocument();
  });

  it('handles roles array with unexpected values gracefully', () => {
    render(
      <AdminRoleProvider roles={['unknown_role' as string]}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    // Unknown role has no visible tab → show no-access message
    expect(screen.getByText('Bạn không có quyền truy cập trang này.')).toBeInTheDocument();
  });

  it('handles large roles array with duplicates', () => {
    render(
      <AdminRoleProvider roles={['specialist', 'specialist', 'customer', 'reviewer']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    // Specialist should see workbench as first tab
    expect(screen.getByTestId('specialist-workbench')).toBeInTheDocument();
  });
});

// ============================================================
// Error tests
// ============================================================

describe('AdminRequestsPage — error', () => {
  it('AdminRoleContext default value is empty array (no provider)', () => {
    // Render without AdminRoleProvider
    render(<AdminRequestsPage />);
    // Falls into loading/empty roles state
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('never renders panel content during loading', () => {
    render(
      <AdminRoleProvider roles={[]}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    // No panel rendered
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('specialist-workbench')).not.toBeInTheDocument();
    expect(screen.queryByTestId('review-console')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delivery-console')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-requests-client')).not.toBeInTheDocument();
  });
});

// ============================================================
// E2E — simulate full flow
// ============================================================

describe('AdminRequestsPage — e2e simulation', () => {
  it('specialist login → layout passes roles → page shows workbench only → no 403', () => {
    // Simulate: admin layout resolves session → specialist roles → passes to page
    render(
      <AdminRoleProvider roles={['specialist']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    // Specialist should see workbench, NOT triage
    expect(screen.getByTestId('specialist-workbench')).toBeInTheDocument();
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
    // 403 message should NOT appear
    expect(screen.queryByText('Bạn không có quyền truy cập. Vui lòng đăng nhập lại.')).not.toBeInTheDocument();
  });

  it('coordinator login → layout passes roles → page shows triage by default → can switch tabs', () => {
    render(
      <AdminRoleProvider roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    // Default tab = triage
    expect(screen.getByTestId('triage-panel')).toBeInTheDocument();
    // Switch to delivery
    fireEvent.click(screen.getByText('📦 Bàn giao'));
    expect(screen.getByTestId('delivery-console')).toBeInTheDocument();
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
  });

  it('reviewer login → only sees review tab → default to review', () => {
    render(
      <AdminRoleProvider roles={['reviewer']}>
        <AdminRequestsPage />
      </AdminRoleProvider>
    );
    expect(screen.getByTestId('review-console')).toBeInTheDocument();
    // No other work panels
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('specialist-workbench')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delivery-console')).not.toBeInTheDocument();
  });
});
