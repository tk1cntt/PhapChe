/**
 * AiIssuePopup Tests
 *
 * Test categories: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────

const mockUseFloating = vi.fn(() => ({
  refs: { setFloating: vi.fn(), setReference: vi.fn() },
  floatingStyles: { position: 'absolute' as const, top: 0, left: 0 },
  context: {} as Record<string, unknown>,
}));

vi.mock('@floating-ui/react', () => ({
  useFloating: (...args: unknown[]) => mockUseFloating(...args),
  offset: vi.fn(() => ({})),
  flip: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
  arrow: vi.fn(() => ({})),
  FloatingArrow: ({ ref, context, className }: Record<string, unknown>) =>
    React.createElement('svg', { ref, 'data-testid': 'floating-arrow', className }),
  FloatingPortal: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'floating-portal' }, children),
}));

// ── Import ──────────────────────────────────────────────────────

import { AiIssuePopup } from '../AiIssuePopup';
import type { Annotation } from '../DocumentAnnotationPanel';

// ── Helpers ─────────────────────────────────────────────────────

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    fileKey: 'file-1',
    authorId: 'user-1',
    authorName: 'Reviewer',
    content: '**Vấn đề:** Thiếu điều khoản bảo mật\n**Đề xuất:** Bổ sung điều khoản NDA\n**Căn cứ:** Luật Sở hữu trí tuệ 2005',
    severity: 'high',
    category: 'issue',
    position: { lineStart: 3, lineEnd: 3 },
    status: 'open',
    aiGenerated: true,
    aiConfidence: 0.85,
    createdAt: '2026-07-20T00:00:00Z',
    updatedAt: '2026-07-20T00:00:00Z',
    ...overrides,
  };
}

function makeReferenceElement(): HTMLElement {
  const p = document.createElement('p');
  p.setAttribute('data-line', '3');
  p.textContent = 'Điều 3: Thiếu điều khoản bảo mật';
  return p;
}

// ── Whitebox Tests ──────────────────────────────────────────────

describe('AiIssuePopup — Whitebox', () => {
  beforeEach(() => {
    mockUseFloating.mockClear();
  });

  it('calls useFloating with right-start placement and correct middleware', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();
    const onClose = vi.fn();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={onClose}
      />,
    );

    expect(mockUseFloating).toHaveBeenCalledTimes(1);
    const config = mockUseFloating.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(config?.placement).toBe('right-start');
    expect(config?.elements).toBeDefined();
    expect((config?.middleware as unknown[] | undefined)?.length).toBe(4);
  });

  it('fires onClose when close button is clicked', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();
    const onClose = vi.fn();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={onClose}
      />,
    );

    const closeBtn = screen.getByTitle('Đóng');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onAccept when accept button is clicked', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();
    const onClose = vi.fn();
    const onAccept = vi.fn();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={onClose}
        onAccept={onAccept}
      />,
    );

    const acceptBtn = screen.getByText('Chấp nhận');
    fireEvent.click(acceptBtn);
    expect(onAccept).toHaveBeenCalledWith(annotation);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onDismiss when dismiss button is clicked', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();
    const onClose = vi.fn();
    const onDismiss = vi.fn();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={onClose}
        onDismiss={onDismiss}
      />,
    );

    const dismissBtn = screen.getByText('Bỏ qua');
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledWith(annotation);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── Blackbox Tests ──────────────────────────────────────────────

describe('AiIssuePopup — Blackbox', () => {
  it('renders severity label for critical', () => {
    const annotation = makeAnnotation({ severity: 'critical' });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Nghiêm trọng')).toBeTruthy();
  });

  it('renders severity label for high', () => {
    const annotation = makeAnnotation({ severity: 'high' });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Cao')).toBeTruthy();
  });

  it('renders severity label for medium', () => {
    const annotation = makeAnnotation({ severity: 'medium' });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Trung bình')).toBeTruthy();
  });

  it('renders AI badge for aiGenerated annotations', () => {
    const annotation = makeAnnotation({ aiGenerated: true });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('AI')).toBeTruthy();
  });

  it('does not render AI badge for human annotations', () => {
    const annotation = makeAnnotation({ aiGenerated: false });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText('AI')).toBeNull();
  });

  it('renders confidence percentage', () => {
    const annotation = makeAnnotation({ aiConfidence: 0.92 });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('92% tin cậy')).toBeTruthy();
  });

  it('shows action buttons only for open aiGenerated annotations', () => {
    const annotation = makeAnnotation({ aiGenerated: true, status: 'open' });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Chấp nhận')).toBeTruthy();
    expect(screen.getByText('Bỏ qua')).toBeTruthy();
  });

  it('hides action buttons for resolved annotations', () => {
    const annotation = makeAnnotation({ aiGenerated: true, status: 'resolved' });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText('Chấp nhận')).toBeNull();
    expect(screen.queryByText('Bỏ qua')).toBeNull();
  });

  it('parses content sections correctly', () => {
    const content = '**Vấn đề:** Thiếu điều khoản\n**Đề xuất:** Bổ sung NDA\n**Căn cứ:** Luật 2005';
    const annotation = makeAnnotation({ content });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Thiếu điều khoản')).toBeTruthy();
    expect(screen.getByText('Bổ sung NDA')).toBeTruthy();
    expect(screen.getByText('Luật 2005')).toBeTruthy();
  });

  it('renders floating arrow element', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('floating-arrow')).toBeTruthy();
  });

  it('renders popup inside FloatingPortal', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('floating-portal')).toBeTruthy();
  });
});

// ── Abnormal Tests ──────────────────────────────────────────────

describe('AiIssuePopup — Abnormal', () => {
  it('returns null when annotation is null', () => {
    const ref = makeReferenceElement();
    const { container } = render(
      <AiIssuePopup
        annotation={null}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    expect(container.querySelector('.ai-issue-popup')).toBeNull();
  });

  it('returns null when referenceElement is null', () => {
    const annotation = makeAnnotation();
    const { container } = render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={null}
        onClose={vi.fn()}
      />,
    );

    expect(container.querySelector('.ai-issue-popup')).toBeNull();
  });

  it('handles annotation with empty content gracefully', () => {
    const annotation = makeAnnotation({ content: '' });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    // Should still render header + structure
    expect(screen.getByTitle('Đóng')).toBeTruthy();
  });

  it('handles annotation with only plain text content (no markdown sections)', () => {
    const annotation = makeAnnotation({ content: 'Chỉ là một ghi chú đơn giản' });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    // Should fall back to displaying raw content
    expect(screen.getByText('Chỉ là một ghi chú đơn giản')).toBeTruthy();
  });

  it('handles annotation without aiConfidence', () => {
    const annotation = makeAnnotation({ aiConfidence: undefined });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    // No confidence text should be shown
    expect(screen.queryByText(/tin cậy/)).toBeNull();
  });

  it('handles unknown severity — defaults to info', () => {
    // @ts-expect-error - testing invalid severity
    const annotation = makeAnnotation({ severity: 'unknown_xyz' });
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    // Should render with info fallback
    expect(screen.getByText('Thông tin')).toBeTruthy();
  });

  it('handles annotation without onAccept or onDismiss', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={vi.fn()}
      />,
    );

    // Accept/dismiss buttons should still render (callbacks are optional)
    const acceptBtn = screen.getByText('Chấp nhận');
    fireEvent.click(acceptBtn);
    // Should not throw
  });
});

// ── Error Tests ─────────────────────────────────────────────────

describe('AiIssuePopup — Error', () => {
  it('handles clicking accept without onAccept callback', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();
    const onClose = vi.fn();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={onClose}
        // onAccept intentionally omitted
      />,
    );

    const acceptBtn = screen.getByText('Chấp nhận');
    // Should not throw
    fireEvent.click(acceptBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles clicking dismiss without onDismiss callback', () => {
    const annotation = makeAnnotation();
    const ref = makeReferenceElement();
    const onClose = vi.fn();

    render(
      <AiIssuePopup
        annotation={annotation}
        referenceElement={ref}
        onClose={onClose}
        // onDismiss intentionally omitted
      />,
    );

    const dismissBtn = screen.getByText('Bỏ qua');
    // Should not throw
    fireEvent.click(dismissBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
