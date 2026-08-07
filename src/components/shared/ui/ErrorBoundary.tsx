'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryTranslations {
  title: string;
  retry: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  translations?: ErrorBoundaryTranslations;
}
  translations?: ErrorBoundaryTranslations;
}
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary class component - catches render errors in child components
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const translations = this.props.translations || DEFAULT_TRANSLATIONS;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <svg
            className="h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            {translations.title}
          </h2>
          {this.state.error && (
            <p className="mt-2 text-center text-gray-600">
              {process.env.NODE_ENV === 'development'
                ? this.state.error.message
                : 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {translations.retry}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Functional wrapper for ErrorBoundary.
 * Class components cannot use hooks directly, so this wrapper passes translations.
 * Note: Renders in root layout (outside NextIntlClientProvider), so uses hardcoded fallbacks.
 */
function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
}: ErrorBoundaryWrapperProps): ReactNode {
  // TODO: Replace with useTranslations() hook once inside NextIntlClientProvider
  return (
    <ErrorBoundary fallback={fallback} onError={onError} translations={DEFAULT_TRANSLATIONS}>
      {children}
    </ErrorBoundary>
  );
}

export { ErrorBoundary, ErrorBoundaryWrapper };
export type { ErrorBoundaryProps };
