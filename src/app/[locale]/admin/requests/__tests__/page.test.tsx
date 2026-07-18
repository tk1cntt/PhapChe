/**
 * AdminRequestsPage tests — tab visibility per role
 *
 * Verifies:
 * - AdminRoleContext provides roles from server layout
 * - Tab visibility matches role-config.ts
 * - Loading/empty/permission-denied states
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdminRoleProvider } from '@/lib/security/AdminRoleContext';
import { canSeeTab } from '@/lib/security/role-config';
import { TAB_VISIBILITY } from '@/lib/security/role-config';
import { NextIntlClientProvider } from 'next-intl';

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

vi.mock('@/styles/pages/admin/requests.css', () => ({}));

// i18n messages for test
const mockMessages = {
  AdminRequests: {
    pageTitle: 'Quản lý yêu cầu',
    pageDescription: 'Quản lý quy trình yêu cầu pháp lý.',
    tabTriage: 'Phân loại & Gán',
    tabWorkbench: 'Đang xử lý',
    tabReview: 'Kiểm duyệt',
    tabDelivery: 'Bàn giao',
    loading: 'Đang tải...',
    errorForbidden: 'Bạn không có quyền truy cập trang này.',
  },
};

function Wrapper({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  return (
    <NextIntlClientProvider locale="vi" messages={mockMessages}>
      <AdminRoleProvider roles={roles ?? []}>
        {children}
      </AdminRoleProvider>
    </NextIntlClientProvider>
  );
}

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

  it('TAB_VISIBILITY delivery is only for super_admin and coordinator_admin', () => {
    expect(TAB_VISIBILITY.delivery).toEqual(['super_admin', 'coordinator_admin']);
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

  it('canSeeTab returns true for reviewer on review tab', () => {
    expect(canSeeTab('review', ['reviewer'])).toBe(true);
  });

  it('all 4 workflow tabs visible for super_admin', () => {
    ['triage', 'workbench', 'review', 'delivery'].forEach(t =>
      expect(canSeeTab(t, ['super_admin'])).toBe(true)
    );
  });

  it('all 4 workflow tabs visible for coordinator_admin', () => {
    ['triage', 'workbench', 'review', 'delivery'].forEach(t =>
      expect(canSeeTab(t, ['coordinator_admin'])).toBe(true)
    );
  });
});

// ============================================================
// Blackbox tests — full component behavior
// ============================================================

describe('AdminRequestsPage — blackbox', () => {
  it('renders loading state when roles are empty', () => {
    render(
      <Wrapper roles={[]}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('renders page header with title', () => {
    render(
      <Wrapper roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Quản lý yêu cầu')).toBeInTheDocument();
  });

  it('specialist sees workbench tab and NOT triage tab', () => {
    render(
      <Wrapper roles={['specialist']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
    expect(screen.queryByText('Phân loại & Gán')).not.toBeInTheDocument();
    expect(screen.queryByText('Bàn giao')).not.toBeInTheDocument();
  });

  it('specialist lands on workbench tab by default', () => {
    render(
      <Wrapper roles={['specialist']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByTestId('specialist-workbench')).toBeInTheDocument();
  });

  it('coordinator sees all 4 workflow tabs', () => {
    render(
      <Wrapper roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Phân loại & Gán')).toBeInTheDocument();
    expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
    expect(screen.getByText('Kiểm duyệt')).toBeInTheDocument();
    expect(screen.getByText('Bàn giao')).toBeInTheDocument();
  });

  it('coordinator lands on triage tab by default', () => {
    render(
      <Wrapper roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByTestId('triage-panel')).toBeInTheDocument();
  });

  it('reviewer sees ONLY review tab', () => {
    render(
      <Wrapper roles={['reviewer']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Kiểm duyệt')).toBeInTheDocument();
    expect(screen.queryByText('Phân loại & Gán')).not.toBeInTheDocument();
    expect(screen.queryByText('Đang xử lý')).not.toBeInTheDocument();
    expect(screen.queryByText('Bàn giao')).not.toBeInTheDocument();
  });

  it('reviewer lands on review tab by default', () => {
    render(
      <Wrapper roles={['reviewer']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByTestId('review-console')).toBeInTheDocument();
  });

  it('user can switch tabs by clicking', () => {
    render(
      <Wrapper roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByTestId('triage-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Đang xử lý'));
    expect(screen.getByTestId('specialist-workbench')).toBeInTheDocument();
  });
});

// ============================================================
// Abnormal tests — edge cases
// ============================================================

describe('AdminRequestsPage — abnormal', () => {
  it('renders forbidden message when user has no admin roles', () => {
    render(
      <Wrapper roles={['customer']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Bạn không có quyền truy cập trang này.')).toBeInTheDocument();
  });

  it('handles roles array with unexpected values gracefully', () => {
    render(
      <Wrapper roles={['unknown_role' as string]}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Bạn không có quyền truy cập trang này.')).toBeInTheDocument();
  });

  it('handles large roles array with duplicates', () => {
    render(
      <Wrapper roles={['specialist', 'specialist', 'customer', 'reviewer']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    // specialist+reviewer: first tab should be workbench (triage not available)
    expect(screen.getByTestId('specialist-workbench')).toBeInTheDocument();
  });

  it('audit_admin has no workflow tabs → gets forbidden', () => {
    render(
      <Wrapper roles={['audit_admin']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Bạn không có quyền truy cập trang này.')).toBeInTheDocument();
  });
});

// ============================================================
// Error tests
// ============================================================

describe('AdminRequestsPage — error', () => {
  it('shows loading state when context has empty roles (no provider)', () => {
    // Render with default AdminRoleProvider (empty roles)
    render(
      <NextIntlClientProvider locale="vi" messages={mockMessages}>
        <AdminRequestsPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('never renders panel content during loading', () => {
    render(
      <Wrapper roles={[]}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('specialist-workbench')).not.toBeInTheDocument();
    expect(screen.queryByTestId('review-console')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delivery-console')).not.toBeInTheDocument();
  });

  it('never renders panel content during forbidden state', () => {
    render(
      <Wrapper roles={['customer']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByText('Bạn không có quyền truy cập trang này.')).toBeInTheDocument();
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
  });
});

// ============================================================
// E2E — simulate full flow
// ============================================================

describe('AdminRequestsPage — e2e simulation', () => {
  it('specialist login → layout passes roles → page shows workbench only', () => {
    render(
      <Wrapper roles={['specialist']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByTestId('specialist-workbench')).toBeInTheDocument();
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Bạn không có quyền truy cập trang này.')).not.toBeInTheDocument();
  });

  it('coordinator login → shows triage by default → can switch to all tabs', () => {
    render(
      <Wrapper roles={['coordinator_admin']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByTestId('triage-panel')).toBeInTheDocument();
    // Switch to delivery (last tab)
    fireEvent.click(screen.getByText('Bàn giao'));
    expect(screen.getByTestId('delivery-console')).toBeInTheDocument();
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
    // Switch to review
    fireEvent.click(screen.getByText('Kiểm duyệt'));
    expect(screen.getByTestId('review-console')).toBeInTheDocument();
  });

  it('reviewer login → only sees review tab → default to review', () => {
    render(
      <Wrapper roles={['reviewer']}>
        <AdminRequestsPage />
      </Wrapper>
    );
    expect(screen.getByTestId('review-console')).toBeInTheDocument();
    expect(screen.queryByTestId('triage-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('specialist-workbench')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delivery-console')).not.toBeInTheDocument();
  });
});
