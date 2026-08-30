/**
 * StatCard / StatsCardGrid Regression Tests
 *
 * Vault removed from the user surface + /cases list removed:
 *   - The dashboard renders exactly 3 stat cards (totalRequests, inProgress,
 *     completed) — no vaultDocs purple card.
 *   - The stat cards are plain, NON-clickable cards: the dashboard is the
 *     primary case view and the case list is already rendered in CasesTable,
 *     so no stat-card hrefs to /{locale}/cases exist.
 *   - Detail links /{locale}/cases/[id] are intentionally unaffected (kept in
 *     CasesTable) — they are out of scope for StatsCardGrid.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { StatsCardGrid } from '../StatCard';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      totalRequests: 'Tổng hồ sơ',
      totalRequestsDesc: 'Tất cả hồ sơ',
      inProgress: 'Đang xử lý',
      inProgressDesc: 'Đang xử lý',
      completed: 'Hoàn thành',
      completedDesc: 'Đã hoàn thành',
    };
    return map[key] ?? key;
  },
  useLocale: () => 'vi',
}));

// NOTE: next/link is intentionally NOT mocked here. StatsCardGrid no longer
// renders links, so if a stat-card link is ever introduced again the render
// will throw and the test fails — keeping cards non-clickable enforced.

const stats = { totalRequests: 5, inProgress: 2, completed: 3 };

describe('StatsCardGrid — 3 plain cards, no vault, no /cases list links', () => {
  it('renders exactly 3 stat cards (no vaultDocs)', () => {
    const { container } = render(<StatsCardGrid data={stats} />);
    expect(container.querySelectorAll('.stat-card')).toHaveLength(3);
  });

  it('shows totalRequests, inProgress and completed values', () => {
    const { container } = render(<StatsCardGrid data={stats} />);
    const text = container.textContent || '';
    expect(text).toContain('5');
    expect(text).toContain('2');
    expect(text).toContain('3');
  });

  it('does NOT render any link (cards are non-clickable, no /cases hrefs)', () => {
    const { container } = render(<StatsCardGrid data={stats} />);
    // No anchors at all — stat cards must be plain cards.
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.querySelectorAll('.stat-card-link')).toHaveLength(0);
    // No reference to the removed /cases list.
    expect(container.querySelector('[href*="/cases"]')).toBeNull();
    expect(container.querySelector('[href*="/dashboard"]')).toBeNull();
  });

  it('does not render any vaultDocs text (vault removed from user surface)', () => {
    const { container } = render(<StatsCardGrid data={stats} />);
    expect(container.textContent).not.toContain('vaultDocs');
    expect(container.textContent).not.toContain('Tài liệu vault');
  });
});
