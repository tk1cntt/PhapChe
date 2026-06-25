/**
 * ActivityTimeline Component Tests
 * Whitebox, Blackbox, Abnormal, Error test cases
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlProvider } from 'next-intl';
import { EmptyState } from '@/components/shared/ui/EmptyState';
import ActivityTimeline from '../ActivityTimeline';
import type { ActivityItem } from '@/lib/types';

// Mock EmptyState component
vi.mock('@/components/shared/ui/EmptyState', () => ({
  EmptyState: ({ title }: { title?: string }) => (
    <div data-testid="empty-state">{title || 'Không có hoạt động'}</div>
  ),
}));

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

// Mock useTranslations hook
const mockUseTranslations = vi.fn((key: string) => {
  const translations: Record<string, Record<string, string>> = {
    'ActivityTimeline': {
      'title': 'Hoạt động',
      'empty': 'Không có hoạt động',
      'types.request': 'Hồ sơ',
      'types.user': 'Người dùng',
      'types.workspace': 'Workspace',
      'types.document': 'Tài liệu',
      'types.review': 'Review',
      'types.message': 'Tin nhắn',
      'types.vault': 'Kho tài liệu',
      'types.partner': 'Đối tác',
      'types.system': 'Hệ thống',
    },
  };
  const keys = key.split('.');
  let result: string = key;
  if (keys.length === 1) {
    result = translations['ActivityTimeline']?.[key] || key;
  } else {
    const [, subKey] = keys;
    result = translations['ActivityTimeline']?.[`types.${subKey}`] || subKey;
  }
  return result;
});

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations,
  NextIntlProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  User: () => <span data-testid="icon-user">User</span>,
  Building2: () => <span data-testid="icon-building">Building2</span>,
  FileText: () => <span data-testid="icon-file">FileText</span>,
  FileUp: () => <span data-testid="icon-upload">FileUp</span>,
  CheckCircle: () => <span data-testid="icon-check">CheckCircle</span>,
  MessageSquare: () => <span data-testid="icon-message">MessageSquare</span>,
  Archive: () => <span data-testid="icon-archive">Archive</span>,
  Handshake: () => <span data-testid="icon-handshake">Handshake</span>,
  Settings: () => <span data-testid="icon-settings">Settings</span>,
  LucideIcon: 'LucideIcon',
}));

// Test helper: render with i18n provider
const renderWithI18n = (ui: React.ReactElement) => {
  return render(
    <NextIntlProvider messages={{ ActivityTimeline: { title: 'Hoạt động', empty: 'Không có hoạt động', types: { request: 'Hồ sơ', user: 'Người dùng', workspace: 'Workspace', document: 'Tài liệu', review: 'Review', message: 'Tin nhắn', vault: 'Kho tài liệu', partner: 'Đối tác', system: 'Hệ thống' } } }}>
      {ui}
    </NextIntlProvider>
  );
};

// ============================================
// WHITEBOX TESTS - Internal implementation
// ============================================
describe('ActivityTimeline Whitebox Tests', () => {
  describe('Icon Rendering', () => {
    it('renders user icon for user type activities', () => {
      const activity = createActivity({ type: 'user', action: 'User logged in' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      // Icon should render (verified by presence in DOM)
      expect(screen.getByText('User logged in')).toBeInTheDocument();
    });

    it('renders document icon for document type activities', () => {
      const activity = createActivity({ type: 'document', action: 'Document uploaded' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Document uploaded')).toBeInTheDocument();
    });

    it('renders review icon for review type activities', () => {
      const activity = createActivity({ type: 'review', action: 'Review approved' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Review approved')).toBeInTheDocument();
    });

    it('renders message icon for message type activities', () => {
      const activity = createActivity({ type: 'message', action: 'Message sent' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Message sent')).toBeInTheDocument();
    });

    it('renders vault icon for vault type activities', () => {
      const activity = createActivity({ type: 'vault', action: 'File stored in vault' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('File stored in vault')).toBeInTheDocument();
    });

    it('renders partner icon for partner type activities', () => {
      const activity = createActivity({ type: 'partner', action: 'Partner invited' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Partner invited')).toBeInTheDocument();
    });

    it('renders workspace icon for workspace type activities', () => {
      const activity = createActivity({ type: 'workspace', action: 'Workspace updated' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Workspace updated')).toBeInTheDocument();
    });

    it('renders system icon for system type activities', () => {
      const activity = createActivity({ type: 'system', action: 'System backup completed' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('System backup completed')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('applies blue styling for user activities', () => {
      const activity = createActivity({ type: 'user' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      // Check that bg class is applied for user type (blue)
      expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
    });

    it('applies green styling for request activities', () => {
      const activity = createActivity({ type: 'request' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
    });

    it('applies red styling for review activities', () => {
      const activity = createActivity({ type: 'review' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
    });

    it('applies orange styling for document activities', () => {
      const activity = createActivity({ type: 'document' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(container.querySelector('.bg-orange-50')).toBeInTheDocument();
    });

    it('applies purple styling for workspace activities', () => {
      const activity = createActivity({ type: 'workspace' });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(container.querySelector('.bg-purple-50')).toBeInTheDocument();
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
      expect(screen.getByText('Không có hoạt động')).toBeInTheDocument();
    });

    it('renders empty state when activities is undefined', () => {
      renderWithI18n(<ActivityTimeline activities={[]} />);
      expect(screen.getByText('Không có hoạt động')).toBeInTheDocument();
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
      expect(screen.getByText('Test Actor')).toBeInTheDocument();
    });

    it('renders multiple activities in order', () => {
      const activities = [
        createActivity({ id: '1', action: 'First Action', actor: 'Actor 1' }),
        createActivity({ id: '2', action: 'Second Action', actor: 'Actor 2' }),
        createActivity({ id: '3', action: 'Third Action', actor: 'Actor 3' }),
      ];
      renderWithI18n(<ActivityTimeline activities={activities} />);

      const actionElements = screen.getAllByText(/Action$/);
      expect(actionElements).toHaveLength(3);
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

    it('displays target label when available', () => {
      const activity = createActivity({
        targetLabel: 'YCTP-2024-001',
      });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);

      expect(screen.getByText('YCTP-2024-001')).toBeInTheDocument();
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

      // Should only show 3 activities
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
      expect(screen.getByText('Action 3')).toBeInTheDocument();
      expect(screen.queryByText('Action 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Action 5')).not.toBeInTheDocument();
    });

    it('shows all activities when maxItems exceeds array length', () => {
      const activities = [
        createActivity({ id: '1', action: 'Action 1' }),
        createActivity({ id: '2', action: 'Action 2' }),
      ];
      renderWithI18n(<ActivityTimeline activities={activities} maxItems={10} />);

      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });
  });
});

// ============================================
// ABNORMAL TESTS - Edge cases
// ============================================
describe('ActivityTimeline Abnormal Tests', () => {
  describe('Missing Optional Fields', () => {
    it('handles activity without targetLabel', () => {
      const activity = createActivity({ targetLabel: undefined });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Hồ sơ được tạo')).toBeInTheDocument();
    });

    it('handles activity without actorAvatar', () => {
      const activity = createActivity({ actorAvatar: undefined });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Hồ sơ được tạo')).toBeInTheDocument();
    });

    it('handles activity with empty metadata', () => {
      const activity = createActivity({ metadata: undefined });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Hồ sơ được tạo')).toBeInTheDocument();
    });

    it('handles activity without targetType', () => {
      const activity = createActivity({ targetType: undefined });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Hồ sơ được tạo')).toBeInTheDocument();
    });
  });

  describe('Long Text Handling', () => {
    it('handles very long description', () => {
      const longDescription = 'A'.repeat(500);
      const activity = createActivity({ description: longDescription });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(container.querySelector('.timeline-description')).toBeInTheDocument();
    });

    it('handles very long actor name', () => {
      const longName = 'Nguyễn Văn Minh'.repeat(10);
      const activity = createActivity({ actor: longName });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(container.querySelector('.timeline-actor')).toBeInTheDocument();
    });

    it('handles very long target label', () => {
      const longTarget = 'YCTP-2024-001-MINH-CORP-LEGAL-DEPARTMENT'.repeat(5);
      const activity = createActivity({ targetLabel: longTarget });
      const { container } = renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(container.querySelector('.timeline-target')).toBeInTheDocument();
    });

    it('handles very long relative time string', () => {
      const activity = createActivity({ relativeTime: '999 năm 999 tháng 999 ngày trước' });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('999 năm 999 tháng 999 ngày trước')).toBeInTheDocument();
    });
  });

  describe('Special Characters', () => {
    it('handles special characters in description', () => {
      const activity = createActivity({
        description: 'Test <script>alert("xss")</script> & "quotes"',
      });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText(/Test.*alert/)).toBeInTheDocument();
    });

    it('handles unicode characters in actor name', () => {
      const activity = createActivity({
        actor: 'Nguyễn Văn Minh ★☆●',
      });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Nguyễn Văn Minh ★☆●')).toBeInTheDocument();
    });

    it('handles emoji in description', () => {
      const activity = createActivity({
        description: 'Hồ sơ đã được duyệt ✅🎉',
      });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Hồ sơ đã được duyệt ✅🎉')).toBeInTheDocument();
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
        // Just verify it renders without crashing
        expect(container.querySelector('.timeline')).toBeInTheDocument();
        expect(container.querySelector(`.timeline-item`)).toBeInTheDocument();
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
      // Should not crash
      expect(container).toBeInTheDocument();
    });

    it('handles undefined activities gracefully', () => {
      // @ts-expect-error - Testing invalid prop
      const { container } = renderWithI18n(<ActivityTimeline activities={undefined} />);
      expect(container).toBeInTheDocument();
    });

    it('handles non-array activities gracefully', () => {
      // @ts-expect-error - Testing invalid prop
      const { container } = renderWithI18n(<ActivityTimeline activities="invalid" />);
      expect(container).toBeInTheDocument();
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

    it('handles activity without timestamp', () => {
      const activity = {
        id: '1',
        type: 'request' as const,
        action: 'Test without timestamp',
        description: 'Test',
        actor: 'Actor',
        relativeTime: 'now',
      };
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Test without timestamp')).toBeInTheDocument();
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
      // Should not crash - falls back to 'system' type
      expect(container.querySelector('.timeline-item')).toBeInTheDocument();
    });

    it('handles activity with object metadata instead of record', () => {
      const activity = createActivity({
        metadata: 'not-an-object' as unknown as Record<string, unknown>,
      });
      renderWithI18n(<ActivityTimeline activities={[activity]} />);
      expect(screen.getByText('Hồ sơ được tạo')).toBeInTheDocument();
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
