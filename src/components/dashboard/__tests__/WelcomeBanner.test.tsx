/**
 * WelcomeBanner Regression Tests
 *
 * Q5 fix: the two quick-action buttons (View documents / Send feedback) were
 * dead (no href / onClick). They must now be locale-prefixed links:
 *   - viewDocuments → /{locale}/dashboard (Recent Documents panel; no customer
 *     vault route exists — see spec 75 / steer 003)
 *   - sendFeedback  → /{locale}/messages (support channel)
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

function makeData(): WelcomeData {
  return {
    workspace: { id: 'ws1', name: 'Công ty ABC', slug: 'abc' },
    activeRequests: 2,
    pendingDocs: 1,
    newReplies: 0,
    userName: 'Khach hang Demo',
  };
}

describe('WelcomeBanner quick actions (Q5)', () => {
  it('renders "View documents" as a locale-prefixed link to /vi/dashboard', () => {
    const { getByText } = render(<WelcomeBanner data={makeData()} />);
    const link = getByText('Xem tài liệu').closest('a');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/vi/dashboard');
  });

  it('renders "Send feedback" as a locale-prefixed link to /vi/messages', () => {
    const { getByText } = render(<WelcomeBanner data={makeData()} />);
    const link = getByText('Gửi phản hồi').closest('a');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/vi/messages');
  });

  it('keeps quick-actions as two anchors (not dead buttons)', () => {
    const { container } = render(<WelcomeBanner data={makeData()} />);
    const actions = container.querySelector('.quick-actions');
    expect(actions).not.toBeNull();
    const anchors = actions!.querySelectorAll('a');
    expect(anchors.length).toBe(2);
  });
});
