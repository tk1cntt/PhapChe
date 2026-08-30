/**
 * StatCard / StatsCardGrid Regression Tests
 *
 * Fix regressions: stat-card hrefs were locale-unprefixed (`/dashboard`,
 * `/vault`) which 404s / loses locale context with `localePrefix: 'always'`.
 * Every stat card must now produce a locale-prefixed href. Hrefs follow
 * spec 75: total/completed → /cases, inProgress → /cases?status=in_progress,
 * vaultDocs → /dashboard (no customer vault route exists).
 */

import { describe, it, expect } from 'vitest';
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
      vaultDocs: 'Tài liệu pháp lý',
      vaultDocsDesc: 'Kho tài liệu',
    };
    return map[key] ?? key;
  },
  useLocale: () => 'vi',
}));

vi.mock('next/link', () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const stats = { totalRequests: 5, inProgress: 2, completed: 3, vaultDocs: 7 };

describe('StatsCardGrid regression — locale-prefixed hrefs', () => {
  it('renders 4 stat cards', () => {
    const { container } = render(<StatsCardGrid data={stats} />);
    expect(container.querySelectorAll('.stat-card')).toHaveLength(4);
  });

  it('every stat-card link is locale-prefixed with spec-75 hrefs (no dead /vault, no bare /dashboard)', () => {
    const { container } = render(<StatsCardGrid data={stats} />);
    const links = container.querySelectorAll<HTMLAnchorElement>('a.stat-card-link');
    expect(links.length).toBe(4);
    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      '/vi/cases',
      '/vi/cases?status=in_progress',
      '/vi/cases',
      '/vi/dashboard',
    ]);
  });

  it('does not contain the dead /vault link or unprefixed /dashboard', () => {
    const { container } = render(<StatsCardGrid data={stats} />);
    const hrefs = Array.from(container.querySelectorAll<HTMLAnchorElement>('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('/vault');
    expect(hrefs).not.toContain('/dashboard');
  });
});
