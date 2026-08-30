/**
 * ResourceTable Regression Tests
 *
 * Vault removed from the user surface: the vaultDocs resource row (which
 * linked to the non-existent `../documents` route) is gone. Only the
 * legal-requests row (now linking to `../dashboard` — the primary case view,
 * since the /cases list was removed) and the member-invites row remain.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResourceTable } from '../ResourceTable';
import type { ResourceData } from '../ResourceTable';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: Record<string, number>) => {
    const map: Record<string, string> = {
      legalRequests: 'Hồ sơ pháp lý',
      legalRequestsDesc: 'Hồ sơ đang xử lý trong workspace',
      countRequests: '{count} hồ sơ',
      statusHealthy: 'Hoạt động bình thường',
      memberInvites: 'Lời mời thành viên',
      memberInvitesDesc: 'Thành viên được mời tham gia',
      countInvites: '{count} lời mời',
      statusPending: 'Đang chờ',
      open: 'Mở',
      resend: 'Gửi lại',
      resourcesTitle: 'Tài nguyên',
      resourceCount: 'Số lượng',
      resourceStatus: 'Trạng thái',
      resourceUpdate: 'Cập nhật',
      action: 'Thao tác',
      vaultDocs: 'Tài liệu vault',
      vaultDocsDesc: 'Hợp đồng, NDA, phụ lục',
      countFiles: '{count} tệp',
    };
    if (opts && typeof opts.count === 'number') return String(opts.count);
    return map[key] ?? key;
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/components/my-cases/Badge', () => ({
  Badge: ({ variant, children }: { variant: string; children: React.ReactNode }) => (
    <span className={`badge ${variant}`}>{children}</span>
  ),
}));

vi.mock('@/components/shared/ui/FormattedDate', () => ({
  FormattedDate: ({ date }: { date: string | null }) => <span>{date ?? '—'}</span>,
}));

function makeResource(): ResourceData {
  return {
    requestCount: 3,
    invitedCount: 2,
    lastRequestUpdate: '2024-01-01T00:00:00.000Z',
    lastInviteUpdate: null,
  };
}

describe('ResourceTable — vault removed, /cases replaced with dashboard', () => {
  it('renders exactly 2 rows: legal-requests and member-invites (no vaultDocs row)', () => {
    render(<ResourceTable resources={makeResource()} />);
    const rows = document.querySelectorAll('.table-card .table-row');
    expect(rows.length).toBe(2);

    expect(screen.getByText('Hồ sơ pháp lý')).toBeInTheDocument();
    expect(screen.getByText('Lời mời thành viên')).toBeInTheDocument();
    expect(screen.queryByText('Tài liệu vault')).not.toBeInTheDocument();
  });

  it('links legal-requests to ../dashboard (primary case view, not the removed /cases list)', () => {
    render(<ResourceTable resources={makeResource()} />);
    const legalRequestLink = screen.getByText('Hồ sơ pháp lý').closest('.table-row')!.querySelector('a.action-link')!;
    expect(legalRequestLink.getAttribute('href')).toBe('../dashboard');
  });

  it('keeps member-invites as a non-navigating row (href "#")', () => {
    render(<ResourceTable resources={makeResource()} />);
    const invitesRow = screen.getByText('Lời mời thành viên').closest('.table-row')!;
    // "#" rows render as a span, not an anchor.
    expect(invitesRow.querySelector('a')).toBeNull();
  });

  it('does not render the vault docs row count or its encrypted status', () => {
    render(<ResourceTable resources={makeResource()} />);
    expect(screen.queryByText('{count} tệp')).not.toBeInTheDocument();
    // statusEncrypted label is no longer used.
    expect(document.querySelector('.badge.green')).toBeTruthy(); // statusHealthy badge
  });
});
