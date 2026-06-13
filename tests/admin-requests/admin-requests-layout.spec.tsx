import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import AdminRequestsClient from '@/components/admin/AdminRequestsClient';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const apiPayload = {
  data: [
    {
      id: 'REQ-2026-1025',
      fullId: 'req-1025',
      type: 'Trademark Registration',
      workspace: 'Demo Legal Workspace',
      workspaceSlug: 'demo-legal-workspace',
      customer: 'Vân Trang',
      customerEmail: 'trang.van@anphat.vn',
      status: 'red',
      statusText: 'cancelled',
      requestType: 'Trademark Registration',
      assignee: 'Chuyên viên Lao động Demo',
      assigneeRole: 'specialist',
      action: 'Điều phối',
    },
  ],
  total: 65,
  page: 1,
  pageSize: 10,
  stats: { total: 65, pending: 2, approved: 8, highPriority: 1 },
  workspaces: [{ id: 'ws-1', name: 'Demo Legal Workspace', slug: 'demo-legal-workspace' }],
};

function mockFetch(payload: unknown, ok = true, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  }));
}

describe('AdminRequestsClient layout/style parity', () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('whitebox: render đúng shell, stats, toolbar, table grid và floating issue từ API', async () => {
    mockFetch(apiPayload);

    render(<AdminRequestsClient />);

    await screen.findByText('REQ-2026-1025');

    const stats = screen.getByTestId('admin-requests-stats');
    expect(within(stats).getAllByTestId('admin-stat-card')).toHaveLength(4);
    expect(screen.getByTestId('admin-requests-toolbar')).toHaveClass('rounded-[15px]', 'p-5', 'mb-5');
    expect(screen.getByTestId('admin-requests-toolbar')).toHaveStyle({ padding: '20px', marginBottom: '20px' });
    expect(screen.getByTestId('admin-requests-search')).toHaveStyle({ width: '330px', height: '44px' });
    expect(screen.getByTestId('admin-requests-table')).toHaveStyle({
      borderRadius: '15px',
      boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
    });
    expect(screen.getByTestId('admin-requests-table-head')).toHaveStyle({
      gridTemplateColumns: '0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr',
    });
    expect(screen.getByTestId('admin-requests-row-0')).toHaveStyle({
      gridTemplateColumns: '0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr',
      minHeight: '68px',
    });
    expect(screen.getByTestId('admin-requests-create')).toHaveStyle({
      background: 'linear-gradient(180deg, #3ba3e7, #2389d0)',
    });
    expect(screen.getByTestId('admin-requests-floating-issue')).toHaveTextContent('1 Issue ×');
  });

  it('blackbox: user thấy text/header chính và dữ liệu row lấy từ API response', async () => {
    mockFetch(apiPayload);

    render(<AdminRequestsClient />);

    expect(await screen.findByRole('heading', { name: 'Hồ sơ yêu cầu' })).toBeInTheDocument();
    expect(screen.getByText('Trạng thái hồ sơ được hiển thị từ backend-owned workflow, không chỉnh sửa trực tiếp bằng raw dropdown.')).toBeInTheDocument();
    ['Mã hồ sơ', 'Workspace', 'Khách hàng', 'Trạng thái', 'Loại yêu cầu', 'Phụ trách', 'Thao tác'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
    expect(screen.getByText('Demo Legal Workspace')).toBeInTheDocument();
    expect(screen.getByText('trang.van@anphat.vn')).toBeInTheDocument();
    expect(screen.getByText('Chuyên viên Lao động Demo')).toBeInTheDocument();
  });

  it('abnormal: API trả danh sách rỗng vẫn giữ layout và không tự tạo row hardcode', async () => {
    mockFetch({ ...apiPayload, data: [], total: 0, stats: { total: 0, pending: 0, approved: 0, highPriority: 0 } });

    render(<AdminRequestsClient />);

    await screen.findByText('Không có yêu cầu nào');
    expect(screen.getByTestId('admin-requests-stats')).toBeInTheDocument();
    expect(screen.getByTestId('admin-requests-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('admin-requests-table')).toBeInTheDocument();
    expect(screen.queryByText('REQ-2026-001')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-requests-floating-issue')).not.toBeInTheDocument();
  });

  it('error: API lỗi vẫn giữ shell layout và cho phép thử lại', async () => {
    mockFetch({ error: 'Database unavailable' }, false, 500);

    render(<AdminRequestsClient />);

    await screen.findByText('Lỗi khi tải dữ liệu');
    expect(screen.getByTestId('admin-requests-stats')).toBeInTheDocument();
    expect(screen.getByTestId('admin-requests-toolbar')).toBeInTheDocument();
    expect(screen.getByText('Database unavailable')).toBeInTheDocument();

    mockFetch(apiPayload);
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await screen.findByText('REQ-2026-1025');
  });
});
