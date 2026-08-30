/**
 * StatsGrid Regression Tests
 *
 * Vault removed from the user surface: the purple "Vault scope" stat card is
 * gone. The grid now shows 3 cards: workspace status, members, and requests.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsGrid } from '../StatsGrid';
import type { StatsData } from '../StatsGrid';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: Record<string, number>) => {
    const map: Record<string, string> = {
      statWorkspace: 'Workspace',
      active: 'Hoạt động',
      inactive: 'Ngưng hoạt động',
      statMembers: 'Thành viên',
      statMembersDesc: '{active} hoạt động, {invited} được mời',
      statRequests: 'Hồ sơ pháp lý',
      statRequestsDesc: '{processing} đang xử lý',
      statVaultScope: 'Vault scope',
      statVaultScopeDesc: 'Tài liệu có phân quyền',
      enabled: 'Đã bật',
      disabled: 'Chưa bật',
    };
    return map[key] ?? key;
  },
}));

function makeStats(): StatsData {
  return {
    isActive: true,
    slug: 'abc',
    memberCount: 4,
    activeMemberCount: 3,
    invitedMemberCount: 1,
    requestCount: 7,
    processingRequestCount: 2,
  };
}

describe('StatsGrid — vault scope card removed', () => {
  it('renders exactly 3 stat cards (workspace, members, requests)', () => {
    render(<StatsGrid stats={makeStats()} />);
    const cards = document.querySelectorAll('.stat-card');
    expect(cards.length).toBe(3);
  });

  it('shows the workspace, members and requests stats', () => {
    render(<StatsGrid stats={makeStats()} />);
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Thành viên')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ pháp lý')).toBeInTheDocument();
  });

  it('no longer renders the vault scope card or its labels', () => {
    render(<StatsGrid stats={makeStats()} />);
    expect(screen.queryByText('Vault scope')).not.toBeInTheDocument();
    expect(screen.queryByText('Đã bật')).not.toBeInTheDocument();
    expect(screen.queryByText('Chưa bật')).not.toBeInTheDocument();
    expect(document.querySelector('.stat-icon.purple')).toBeNull();
  });
});
