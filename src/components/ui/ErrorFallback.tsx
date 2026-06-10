'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  onRetry?: () => void;
}

/**
 * Shared error fallback component for graceful error recovery.
 * Displays error message, logs to console, and provides retry/go-home actions.
 */
export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const router = useRouter();

  useEffect(() => {
    // Log full stack trace for debugging
    if (error.stack) {
      console.error('[ErrorFallback]', error.stack);
    }
  }, [error]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    router.push('/vi');
  };

  return (
    <Result
      status="error"
      title="Something went wrong"
      subTitle={error.message || 'An unexpected error occurred. Please try again.'}
      extra={[
        <Button key="retry" type="primary" onClick={handleRetry}>
          Try Again
        </Button>,
        <Button key="home" onClick={handleGoHome}>
          Go to Home
        </Button>,
      ]}
    />
  );
}
