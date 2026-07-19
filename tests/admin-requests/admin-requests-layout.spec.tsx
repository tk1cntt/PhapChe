import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminRequestsClient from '@/components/admin/AdminRequestsClient';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Default successful mock data
const triageItem = {
  id: 'REQ-2026-1025', index: 1, code: 'REQ-2026-1025', title: 'Trademark Registration',
  description: 'Test description', source: 'Web', date: '2026-01-01',
  missingOrg: false, missingWorkspace: false, missingUser: false,
  suggestedService: 'IP', priority: 'HIGH',
};

const requestItem = {
  id: 'req-1', fullId: 'req-1', code: 'REQ-2026-1025', title: 'Trademark Registration',
  workspace: 'Demo Legal Workspace', workspaceSlug: 'demo-legal-workspace',
  customer: 'Vân Trang', customerEmail: 'trang.van@anphat.vn',
  status: 'red', statusText: 'cancelled', assignee: 'Chuyên viên Lao động Demo',
  assigneeRole: 'specialist', sla: null, slaText: 'No SLA',
  type: 'Trademark Registration', action: 'Điều phối', priority: 'HIGH',
  createdBy: { name: 'Test User', email: 'test@test.com' },
};

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/admin/requests/triage')) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({ data: [triageItem], total: 65, page: 1, pageSize: 10, totalPages: 7 }),
      });
    }
    if (url.includes('/api/admin/requests/stats')) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({
          pendingTriage: { count: 2, description: '2 cases need triage' },
          total: { count: 65, description: 'Total' },
          specialistPartner: { count: 10, description: '' },
          dedicatedPartner: { count: 5, description: '' },
          slaRisk: { count: 1, description: '1 overdue' },
          statusBreakdown: [
            { name: 'Chờ phân loại', count: 2, percentage: 3, color: 'orange' as const, note: 'Test' },
          ],
        }),
      });
    }
    if (url.includes('/api/admin/organizations')) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({
          data: [{ id: 'org-1', name: 'Test Org', status: 'active', workspaces: [{ id: 'ws-1', name: 'Demo Workspace', slug: 'demo' }] }],
        }),
      });
    }
    if (url.includes('/api/admin/partners')) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({
          specialistPartners: [{ id: 'p-1', name: 'Specialist 1', type: 'individual', modelType: 'specialist', activeRequestCount: 5 }],
          dedicatedPartners: [],
        }),
      });
    }
    if (url.includes('/api/admin/requests')) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({
          data: [requestItem], total: 65, page: 1, pageSize: 10, totalPages: 7,
          workspaces: [{ id: 'ws-1', name: 'Demo Legal Workspace', slug: 'demo-legal-workspace' }],
        }),
      });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  }));
}

describe('AdminRequestsClient layout/style parity', () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Whitebox Tests ──

  it('whitebox: render đúng shell — stats-grid, triage section, assignment panel, routing panel, main table', async () => {
    mockFetch();

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    // Stats grid renders 5 stat-card children
    const statsGrid = document.querySelector('.stats-grid');
    expect(statsGrid).not.toBeNull();
    expect(statsGrid!.querySelectorAll('.stat-card')).toHaveLength(5);

    // Triage section with its sub-panels
    expect(document.querySelector('.triage-section')).not.toBeNull();
    expect(document.querySelector('.triage-grid')).not.toBeNull();
    expect(document.querySelector('.triage-workbench')).not.toBeNull();
    expect(document.querySelector('.triage-list-panel')).not.toBeNull();
    expect(document.querySelector('.triage-detail-panel')).not.toBeNull();
    expect(document.querySelector('.status-overview-panel')).not.toBeNull();

    // Assignment / partner panel
    expect(document.querySelector('.assignment-panel')).not.toBeNull();
    expect(document.querySelector('.partner-type-grid')).not.toBeNull();

    // Routing / filter panel
    expect(document.querySelector('.routing-panel')).not.toBeNull();

    // Main table
    expect(document.querySelector('.table-card')).not.toBeNull();
    expect(document.querySelector('.board-column')).not.toBeNull();
  });

  it('whitebox: stats grid hiển thị đúng số liệu từ API stats + fallback', async () => {
    mockFetch();

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    // Stats values
    const statValues = document.querySelectorAll('.stat-value');
    const values = Array.from(statValues).map(el => el.textContent);
    // 2 (pendingTriage), 65 (total), 10 (specialistPartner count), 5 (dedicatedPartner count), 1 (slaRisk)
    expect(values).toEqual(['2', '65', '10', '5', '1']);
  });

  it('whitebox: triage list panel hiển thị danh sách case và pagination khi total > pageSize', async () => {
    mockFetch();

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    // Triage card rendered
    const triageCards = document.querySelectorAll('.triage-card');
    expect(triageCards.length).toBeGreaterThanOrEqual(1);
    expect(triageCards[0].textContent).toContain('Trademark Registration');

    // Pagination shown (total=65 > pageSize=10)
    expect(document.querySelector('.triage-pagination')).not.toBeNull();
    expect(screen.getByText('Trang 1 / 7')).toBeInTheDocument();
  });

  it('whitebox: triage card click chọn và hiển thị form chi tiết', async () => {
    mockFetch();

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    // Initially no case selected — empty detail shown
    expect(screen.getByText('selectCaseToTriage')).toBeInTheDocument();

    // Click a triage card using fireEvent
    const triageCard = document.querySelector('.triage-card') as HTMLElement;
    fireEvent.click(triageCard);

    // Now detail panel shows the triage form
    await screen.findByText('quickTriageForm');
    expect(screen.getByText('currentlyTriaging')).toBeInTheDocument();
  });

  // ── Blackbox Tests ──

  it('blackbox: user thấy i18n labels và dữ liệu từ API response trong main table', async () => {
    mockFetch();

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    // Page header labels (raw i18n keys in test)
    expect(screen.getByText('pageTitle')).toBeInTheDocument();
    expect(screen.getByText('pageDescription')).toBeInTheDocument();

    // Stat labels
    expect(screen.getByText('statPendingTriage')).toBeInTheDocument();
    expect(screen.getByText('statTotal')).toBeInTheDocument();
    expect(screen.getByText('statSpecialistPartner')).toBeInTheDocument();

    // Section titles
    expect(screen.getByText('triageTitle')).toBeInTheDocument();
    expect(screen.getByText('partnerModelTitle')).toBeInTheDocument();
    expect(screen.getByText('routingTitle')).toBeInTheDocument();

    // Data from API in main table (multiple occurrences due to Org + Workspace cols)
    expect(screen.getAllByText('Demo Legal Workspace').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Chuyên viên Lao động Demo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Trademark Registration').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('cancelled')).toBeInTheDocument();
    expect(screen.getByText('No SLA')).toBeInTheDocument();
  });

  it('blackbox: user phân biệt được specialist partner và dedicated partner sections', async () => {
    mockFetch();

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    // Partner type cards
    expect(document.querySelector('.partner-type-card.specialist')).not.toBeNull();
    expect(document.querySelector('.partner-type-card.dedicated')).not.toBeNull();

    // Labels within cards
    expect(screen.getByText('specialistTitle')).toBeInTheDocument();
    expect(screen.getByText('dedicatedTitle')).toBeInTheDocument();
  });

  it('blackbox: user thấy mode tabs trong assignment panel', async () => {
    mockFetch();

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    // Three mode tabs
    const tabs = document.querySelectorAll('.mode-tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0].textContent).toBe('tabAll');
    expect(tabs[1].textContent).toBe('tabSpecialist');
    expect(tabs[2].textContent).toBe('tabDedicated');
  });

  // ── Abnormal Tests ──

  it('abnormal: triage API trả data rỗng — hiển thị message trống và vẫn giữ layout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/admin/requests/triage')) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }),
        });
      }
      if (url.includes('/api/admin/requests/stats')) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve({
            pendingTriage: { count: 0, description: '' },
            total: { count: 0, description: '' },
            specialistPartner: { count: 0, description: '' },
            dedicatedPartner: { count: 0, description: '' },
            slaRisk: { count: 0, description: '' },
            statusBreakdown: [],
          }),
        });
      }
      if (url.includes('/api/admin/organizations')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ data: [] }) });
      }
      if (url.includes('/api/admin/partners')) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve({ specialistPartners: [], dedicatedPartners: [] }),
        });
      }
      if (url.includes('/api/admin/requests')) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    }));

    render(<AdminRequestsClient />);

    // Wait for loading to resolve
    await screen.findByText('Không có hồ sơ nào cần phân loại');

    // Layout elements still exist
    expect(document.querySelector('.stats-grid')).not.toBeNull();
    expect(document.querySelector('.triage-section')).not.toBeNull();
    expect(document.querySelector('.table-card')).not.toBeNull();

    // Main table shows empty state
    expect(screen.getByText('Không có hồ sơ nào')).toBeInTheDocument();

    // Stat values are 0
    const statValues = document.querySelectorAll('.stat-value');
    const values = Array.from(statValues).map(el => el.textContent);
    expect(values).toEqual(['0', '0', '0', '0', '0']);
  });

  it('abnormal: stats API trả thiếu trường — component dùng fallback values', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/admin/requests/triage')) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve({ data: [triageItem], total: 65, page: 1, pageSize: 10, totalPages: 7 }),
        });
      }
      if (url.includes('/api/admin/requests/stats')) {
        // Return minimal stats — missing most fields
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve({
            pendingTriage: null,
            total: null,
            specialistPartner: null,
            dedicatedPartner: null,
            slaRisk: null,
            statusBreakdown: null,
          }),
        });
      }
      if (url.includes('/api/admin/organizations')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ data: [] }) });
      }
      if (url.includes('/api/admin/partners')) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve({ specialistPartners: [], dedicatedPartners: [] }),
        });
      }
      if (url.includes('/api/admin/requests')) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve({ data: [requestItem], total: 65, page: 1, pageSize: 10, totalPages: 7 }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    }));

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    // Should not crash — component must handle null stats
    expect(document.querySelector('.stats-grid')).not.toBeNull();
    expect(document.querySelector('.triage-section')).not.toBeNull();
  });

  // ── Error Tests ──

  it('error: fetch mạng thất bại hoàn toàn — component hiển thị loading rồi fallback trống (internal catch)', async () => {
    // Each fetch function catches its own errors internally,
    // so the component never shows the top-level error state from Promise.all.
    // Test that individual fetch failures result in empty states.

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    render(<AdminRequestsClient />);

    // Component should render without crashing — all fetches catch internally
    // Wait for loading to finish
    await screen.findByText('Không có hồ sơ nào cần phân loại');

    // Layout still intact
    expect(document.querySelector('.stats-grid')).not.toBeNull();
    expect(document.querySelector('.triage-section')).not.toBeNull();
    expect(document.querySelector('.table-card')).not.toBeNull();
  });

  it('error: HTTP 500 từ API — component vẫn render với fallback và không crash', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      // Return 500 but component catches internally
      return Promise.resolve({
        ok: false, status: 500, statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Server error')),
      });
    }));

    render(<AdminRequestsClient />);

    // Component catches errors internally, falls back to empty states
    await screen.findByText('Không có hồ sơ nào cần phân loại');

    // Layout survives
    expect(document.querySelector('.stats-grid')).not.toBeNull();
    expect(document.querySelector('.triage-section')).not.toBeNull();
    expect(document.querySelector('.table-card')).not.toBeNull();
  });

  it('error: HTTP 403 forbidden — component hiển thị fallback an toàn', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: false, status: 403, statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });
    }));

    render(<AdminRequestsClient />);

    // Component still renders — all fetches catch errors internally
    await screen.findByText('Không có hồ sơ nào cần phân loại');

    // Layout remains
    expect(document.querySelector('.stats-grid')).not.toBeNull();
  });
});
