import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { ReactNode } from 'react';

// Mock next-intl for ErrorBoundaryWrapper
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'title': 'Đã xảy ra lỗi',
      'retry': 'Thử lại',
    };
    return translations[key] || key;
  },
}));

import { ErrorBoundary, ErrorBoundaryWrapper } from './ErrorBoundary';

// Mock console.error
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('ErrorBoundary Component', () => {
  const ConsoleErrorMessage = new RegExp('ErrorBoundary caught an error');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Success</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('catches and displays error with fallback UI', () => {
    function ThrowComponent() {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Đã xảy ra lỗi/i)).toBeInTheDocument();
    expect(screen.getByText(/Thử lại/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onErrorMock = vi.fn();

    function ThrowComponent() {
      throw new Error('Custom error');
    }

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalled();
    const errorInfo = onErrorMock.mock.calls[0][0];
    expect(errorInfo.message).toBe('Custom error');
  });

  it('handles error reset by clicking retry button', () => {
    // Use a ref to control when the component should throw
    let shouldThrow = true;

    function RecoverableComponent() {
      if (shouldThrow) {
        throw new Error('Initial error');
      }
      return <div data-testid="recovered">Recovered</div>;
    }

    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <RecoverableComponent />
      </ErrorBoundary>
    );

    // Verify error state initially
    expect(getByText(/Đã xảy ra lỗi/i)).toBeInTheDocument();
    expect(queryByText(/Recovered/i)).not.toBeInTheDocument();

    // Change the condition so component won't throw on next render
    shouldThrow = false;

    // Click the retry button - this resets the error boundary state
    fireEvent.click(getByText(/Thử lại/i));

    // Now the component should recover
    expect(queryByText(/Đã xảy ra lỗi/i)).not.toBeInTheDocument();
    expect(getByText(/Recovered/i)).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    function ThrowComponent() {
      throw new Error('Test error');
    }

    const customFallback = (
      <div data-testid="custom-fallback">
        <h3>Tùy chỉnh lỗi</h3>
        <p>Lỗi không mong muốn</p>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Tùy chỉnh lỗi/i)).toBeInTheDocument();
    expect(screen.getByText(/Lỗi không mong muốn/i)).toBeInTheDocument();
    expect(screen.queryByText(/Đã xảy ra lỗi/i)).not.toBeInTheDocument();
  });

  it('accepts custom translations', () => {
    function ThrowComponent() {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary
        translations={{
          title: 'Có vấn đề!',
          retry: 'Thử lần nữa',
        }}
      >
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Có vấn đề!/i)).toBeInTheDocument();
    expect(screen.getByText(/Thử lần nữa/i)).toBeInTheDocument();
  });
});

describe('ErrorBoundaryWrapper', () => {
  it('wraps ErrorBoundary with i18n translations', () => {
    function ThrowComponent() {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundaryWrapper>
        <ThrowComponent />
      </ErrorBoundaryWrapper>
    );

    expect(screen.getByText(/Đã xảy ra lỗi/i)).toBeInTheDocument();
  });
});
