import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/app/[locale]/customer/components/Badge';
import { ProgressBar } from '@/app/[locale]/customer/components/ProgressBar';
import { StatCard } from '@/app/[locale]/customer/components/StatCard';
import { WelcomeCard } from '@/app/[locale]/customer/components/WelcomeCard';

describe('Badge Component', () => {
  // WHITEBOX: Unit test for each variant
  it('renders green variant correctly', () => {
    render(<Badge variant="green">Test</Badge>);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Test')).toHaveClass('badge', 'green');
  });

  // WHITEBOX: Test all 5 variants
  ['green', 'orange', 'blue', 'red', 'purple'].forEach((variant) => {
    it(`renders ${variant} variant`, () => {
      render(<Badge variant={variant as 'green' | 'orange' | 'blue' | 'red' | 'purple'}>{variant}</Badge>);
      expect(screen.getByText(variant)).toHaveClass(variant);
    });
  });

  // ABNORMAL: Empty children handling
  it('handles empty children', () => {
    const { container } = render(<Badge variant="green">{''}</Badge>);
    expect(container.querySelector('.badge')).toBeInTheDocument();
    expect(container.querySelector('.badge')).toHaveClass('green');
  });
});

describe('ProgressBar Component', () => {
  // WHITEBOX: Test each status
  it('renders ok status with green color', () => {
    const { container } = render(<ProgressBar value={50} status="ok" />);
    expect(container.querySelector('span')).toHaveStyle({ width: '50%' });
  });

  // ABNORMAL: Boundary values
  it('handles 0% progress', () => {
    const { container } = render(<ProgressBar value={0} status="ok" />);
    expect(container.querySelector('span')).toHaveStyle({ width: '0%' });
  });

  it('handles 100% progress', () => {
    const { container } = render(<ProgressBar value={100} status="ok" />);
    expect(container.querySelector('span')).toHaveStyle({ width: '100%' });
  });

  // WHITEBOX: Test all 3 statuses
  it('renders warn status', () => {
    const { container } = render(<ProgressBar value={75} status="warn" />);
    expect(container.querySelector('span')).toHaveClass('warn');
  });

  it('renders danger status', () => {
    const { container } = render(<ProgressBar value={90} status="danger" />);
    expect(container.querySelector('span')).toHaveClass('danger');
  });
});

describe('StatCard Component', () => {
  // WHITEBOX: Test all icon and variant combinations
  const icons = ['file', 'clock', 'check', 'folder'] as const;
  const variants = ['blue', 'green', 'orange', 'purple'] as const;

  icons.forEach((icon) => {
    variants.forEach((variant) => {
      it(`renders with icon=${icon} and variant=${variant}`, () => {
        render(
          <StatCard
            title="Test Title"
            value={42}
            description="Test Description"
            icon={icon}
            variant={variant}
          />
        );
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
      });
    });
  });

  // ABNORMAL: Zero value
  it('handles zero value', () => {
    render(
      <StatCard
        title="Zero"
        value={0}
        description="No items"
        icon="file"
        variant="blue"
      />
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  // ABNORMAL: Large value
  it('handles large value', () => {
    render(
      <StatCard
        title="Large"
        value={999999}
        description="Many items"
        icon="folder"
        variant="purple"
      />
    );
    expect(screen.getByText('999999')).toBeInTheDocument();
  });
});

describe('WelcomeCard Component', () => {
  // WHITEBOX: Test dynamic message generation
  it('displays processing count in message', () => {
    render(
      <WelcomeCard
        userName="Test User"
        workspaceName="Test Workspace"
        processingCount={5}
        pendingDocs={2}
        newFeedback={3}
      />
    );
    expect(screen.getByText(/5 hồ sơ/)).toBeInTheDocument();
    expect(screen.getByText(/Test Workspace/)).toBeInTheDocument();
  });

  // WHITEBOX: Test action buttons
  it('renders action buttons', () => {
    render(
      <WelcomeCard
        userName="User"
        workspaceName="WS"
        processingCount={0}
        pendingDocs={0}
        newFeedback={0}
      />
    );
    expect(screen.getByText('Xem tài liệu')).toBeInTheDocument();
    expect(screen.getByText('Gửi phản hồi')).toBeInTheDocument();
  });

  // ABNORMAL: Zero counts
  it('handles all zero counts', () => {
    render(
      <WelcomeCard
        userName="User"
        workspaceName="WS"
        processingCount={0}
        pendingDocs={0}
        newFeedback={0}
      />
    );
    expect(screen.getByText(/0 hồ sơ/)).toBeInTheDocument();
  });

  // WHITEBOX: Test dynamic description with various values
  it('displays pending docs count', () => {
    render(
      <WelcomeCard
        userName="User"
        workspaceName="WS"
        processingCount={3}
        pendingDocs={7}
        newFeedback={0}
      />
    );
    expect(screen.getByText(/7 tài liệu/)).toBeInTheDocument();
  });

  it('displays new feedback count', () => {
    render(
      <WelcomeCard
        userName="User"
        workspaceName="WS"
        processingCount={0}
        pendingDocs={0}
        newFeedback={5}
      />
    );
    expect(screen.getByText(/5 phản hồi/)).toBeInTheDocument();
  });
});
