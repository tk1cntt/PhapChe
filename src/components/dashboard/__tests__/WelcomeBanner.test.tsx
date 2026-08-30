/**
 * WelcomeBanner Regression Tests
 *
 * Vault removed from the user surface: the "Xem tài liệu" (View documents)
 * quick action was dropped — it anchored the vault Recent Documents panel,
 * which no longer exists. Only "Gửi phản hồi" (Send feedback) remains, still
 * pointing at the locale-prefixed /{locale}/messages support channel.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import WelcomeBanner from '../WelcomeBanner';
import type { WelcomeData } from '../DashboardClient';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      title: 'Chào mừng',
      requestsProcessing: '{count} hồ sơ đang xử lý',
      docsPending: '{count} tài liệu chờ xử lý',
      repliesNew: '{count} phản hồi mới',
      statusNormal: 'Mọi thứ bình thường',
      workspaceScope: 'Không gian {workspace}',
      viewDocuments: 'Xem tài liệu',
      sendFeedback: 'Gửi phản hồi',
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

function makeData(): WelcomeData {
  return {
    workspace: { id: 'ws1', name: 'Công ty ABC', slug: 'abc' },
    activeRequests: 2,
    pendingDocs: 1,
    newReplies: 0,
    userName: 'Khach hang Demo',
  };
}

describe('WelcomeBanner quick actions (vault removed)', () => {
  it('renders only one quick action: "Send feedback" → /vi/messages', () => {
    const { container } = render(<WelcomeBanner data={makeData()} />);
    const actions = container.querySelector('.quick-actions');
    expect(actions).not.toBeNull();
    const anchors = actions!.querySelectorAll('a');
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute('href')).toBe('/vi/messages');
  });

  it('no longer renders the "View documents" vault action', () => {
    const { queryByText } = render(<WelcomeBanner data={makeData()} />);
    // 'Xem tài liệu' must not appear anywhere (vault removed from user surface).
    const link = queryByText('Xem tài liệu')?.closest('a');
    expect(link).toBeUndefined();
    expect(queryByText('Xem tài liệu')).toBeNull();
  });

  it('does not link to /vi/dashboard from quick actions', () => {
    const { container } = render(<WelcomeBanner data={makeData()} />);
    const anchors = Array.from(container.querySelectorAll('a'));
    expect(anchors.map((a) => a.getAttribute('href'))).not.toContain('/vi/dashboard');
  });
});
