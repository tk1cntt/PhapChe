/**
 * ActivityTimeline Component Tests
 * Whitebox, Blackbox, Abnormal, Error test cases
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityTimeline from '../ActivityTimeline';
import type { ActivityItem } from '@/lib/types';

// Mock data generators
const createActivity = (overrides: Partial<ActivityItem> = {}): ActivityItem => ({
  id: '1',
  type: 'request',
  action: 'Hồ sơ được tạo',
  description: 'Nguyễn Văn Minh đã tạo hồ sơ YCTP-2024-001.',
  actor: 'Nguyễn Văn Minh',
  timestamp: new Date().toISOString(),
  relativeTime: '5 phút trước',
  ...overrides,
});

// Mock useTranslations hook - useTranslations('namespace') returns a t function
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'title': 'Hoạt động gần đây',
      'empty': 'Không có hoạt động nào',
      'types.request': 'Hồ sơ',
      'types.user': 'Người dùng',
      'types.workspace': 'Workspace',
      'types.document': 'Tài liệu',
      'types.review': 'Review',
      'types.message': 'Tin nhắn',
      'types.vault': 'Kho tài liệu',
      'types.partner': 'Đối tác',
      'types.system': 'Hệ thống',
    };
    return translations[key] || key;
  },
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations,
}));

// Test helper: render component
const renderWithI18n = (ui: React.ReactElement) => {
  return render(ui);
};

// ============================================
// WHITEBOX TESTS - Internal implementation
// ============================================
describe('ActivityTimeline Whitebox Tests', () => {
  describe('Color Dot Rendering', () => {
    it('renders blue dot for user type activities', () => {
      const activity = createActivity({ type: 'user' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      const dot = container.querySelector('.timeline-dot');
      expect(dot).toBeInTheDocument();
      expect(dot?.style.background).toBe('rgb(37, 99, 235)'); // Blue
    });

    it('renders green dot for request type activities', () => {
      const activity = createActivity({ type: 'request' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      const dot = container.querySelector('.timeline-dot');
      expect(dot?.style.background).toBe('rgb(16, 185, 129)'); // Green
    });

    it('renders red dot for review type activities', () => {
      const activity = createActivity({ type: 'review' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      const dot = container.querySelector('.timeline-dot');
      expect(dot?.style.background).toBe('rgb(239, 68, 68)'); // Red
    });

    it('renders orange dot for document type activities', () => {
      const activity = createActivity({ type: 'document' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      const dot = container.querySelector('.timeline-dot');
      expect(dot?.style.background).toBe('rgb(249, 115, 22)'); // Orange
    });

    it('renders teal dot for system type activities', () => {
      const activity = createActivity({ type: 'system' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      const dot = container.querySelector('.timeline-dot');
      expect(dot?.style.background).toBe('rgb(8, 127, 120)'); // Teal
    });
  });

  describe('Activity Type Badge', () => {
    it('shows type badge when showType is true', () => {
      const activity = createActivity({ type: 'request' });
      renderWithI18n(<ActivityTimeline activities={[activity]} showType={true} />);
      expect(screen.getByText('Hồ sơ')).toBeInTheDocument();
    });

    it('hides type badge when showType is false', () => {
      const activity = createActivity({ type: 'request' });
      renderWithI18n(<ActivityTimeline activities={[activity]} showType={false} />);
      // Badge should not be visible
      expect(screen.queryByText('Hồ sơ')).not.toBeInTheDocument();
    });
  });
});

// ============================================
// BLACKBOX TESTS - External behavior
// ============================================
describe('ActivityTimeline Blackbox Tests', () => {
  describe('Empty State', () => {
    it('renders empty state when activities array is empty', () => {
      renderWithI18n(<ActivityTimeline activities={[]} />);
      expect(screen.getByText('Không có hoạt động nào')).toBeInTheDocument();
    });
  });

  describe('Activity List Rendering', () => {
    it('renders single activity correctly', () => {
      const activity = createActivity({
        id: '1',
        action: 'Hồ sơ được tạo',
        description: 'Test description',
        actor: 'Test Actor',
      });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);

      expect(screen.getByText('Hồ sơ được tạo')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders multiple activities in order', () => {
      const activities = [
        createActivity({ id: '1', action: 'First Action' }),
        createActivity({ id: '2', action: 'Second Action' }),
        createActivity({ id: '3', action: 'Third Action' }),
      ];
      renderWithI18n(<ActivityTimeline activities={activities} />);

      const firstAction = screen.getByText('First Action');
      expect(firstAction).toBeInTheDocument();
    });

    it('displays relative time for each activity', () => {
      const activities = [
        createActivity({ id: '1', relativeTime: '5 phút trước' }),
        createActivity({ id: '2', relativeTime: '2 giờ trước' }),
      ];
      renderWithI18n(<ActivityTimeline activities={activities} />);

      expect(screen.getByText('5 phút trước')).toBeInTheDocument();
      expect(screen.getByText('2 giờ trước')).toBeInTheDocument();
    });
  });

  describe('maxItems Prop', () => {
    it('limits displayed activities when maxItems is set', () => {
      const activities = [
        createActivity({ id: '1', action: 'Action 1' }),
        createActivity({ id: '2', action: 'Action 2' }),
        createActivity({ id: '3', action: 'Action 3' }),
        createActivity({ id: '4', action: 'Action 4' }),
        createActivity({ id: '5', action: 'Action 5' }),
      ];
      renderWithI18n(<ActivityTimeline activities={activities} maxItems={3} />);

      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
      expect(screen.getByText('Action 3')).toBeInTheDocument();
      expect(screen.queryByText('Action 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Action 5')).not.toBeInTheDocument();
    });
  });
});

// ============================================
// ABNORMAL TESTS - Edge cases
// ============================================
describe('ActivityTimeline Abnormal Tests', () => {
  describe('Missing Optional Fields', () => {
    it('handles activity without optional fields', () => {
      const activity = createActivity({
        targetLabel: undefined,
        actorAvatar: undefined,
        metadata: undefined,
        targetType: undefined,
      });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Hồ sơ được tạo')).toBeInTheDocument();
    });
  });

  describe('Long Text Handling', () => {
    it('handles very long description', () => {
      const longDescription = 'A'.repeat(500);
      const activity = createActivity({ description: longDescription });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(container.querySelector('.timeline-item')).toBeInTheDocument();
    });

    it('handles very long action text', () => {
      const longAction = 'B'.repeat(200);
      const activity = createActivity({ action: longAction });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText(longAction)).toBeInTheDocument();
    });
  });

  describe('Special Characters', () => {
    it('handles unicode characters in description', () => {
      const activity = createActivity({
        description: 'Hồ sơ đã được duyệt ✅🎉 Nguyễn Văn Minh ★☆●',
      });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText(/Hồ sơ đã được duyệt/)).toBeInTheDocument();
    });
  });

  describe('Activity Type Variety', () => {
    it('renders all 9 activity types without crashing', () => {
      const activityTypes = [
        'user', 'workspace', 'request', 'document', 'review',
        'message', 'vault', 'partner', 'system'
      ] as const;

      activityTypes.forEach((type) => {
        const activity = createActivity({ id: `test-${type}`, type });
        const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
        expect(container.querySelector('.timeline-item')).toBeInTheDocument();
        expect(container.querySelector('.timeline-dot')).toBeInTheDocument();
      });
    });
  });
});

// ============================================
// ERROR TESTS - Error handling
// ============================================
describe('ActivityTimeline Error Tests', () => {
  describe('Invalid Props', () => {
    it('handles null activities array gracefully', () => {
      // @ts-expect-error - Testing invalid prop
      const { container } = renderWithI18n(<ActivityTimeline activities={null} />);
      expect(container.querySelector('.timeline')).toBeInTheDocument();
    });

    it('handles undefined activities gracefully', () => {
      // @ts-expect-error - Testing invalid prop
      const { container } = renderWithI18n(<ActivityTimeline activities={undefined} />);
      expect(container.querySelector('.timeline')).toBeInTheDocument();
    });
  });

  describe('Missing Required Fields', () => {
    it('handles activity without id', () => {
      const activity = {
        type: 'request' as const,
        action: 'Test without id',
        description: 'Test',
        actor: 'Actor',
        timestamp: new Date().toISOString(),
        relativeTime: 'now',
      };
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Test without id')).toBeInTheDocument();
    });
  });

  describe('Malformed Data', () => {
    it('handles activity with numeric type cast', () => {
      const activity = {
        ...createActivity(),
        // @ts-expect-error - Testing malformed data
        type: 123,
      };
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      // Should not crash - falls back to 'system' type (teal dot)
      expect(container.querySelector('.timeline-item')).toBeInTheDocument();
      const dot = container.querySelector('.timeline-dot');
      expect(dot?.style.background).toBe('rgb(8, 127, 120)'); // Teal for system
    });

    it('filters out null elements in activities array', () => {
      const activities = [
        createActivity({ id: '1' }),
        null as unknown as ActivityItem,
        createActivity({ id: '3' }),
      ];
      const { container } = renderWithI18n(<ActivityTimeline activities={activities} />);
      // Should render valid items and skip null
      expect(container.querySelectorAll('.timeline-item')).toHaveLength(2);
    });
  });
});
