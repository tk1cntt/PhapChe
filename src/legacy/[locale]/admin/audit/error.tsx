'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error]', error);
  }, [error]);

  const router = useRouter();
  if (error.message === 'UNAUTHENTICATED') {
    router.push('/vi/sign-in');
    return null;
  }

  return (
    <Result
      status="error"
      title="Something went wrong"
      subTitle="An error occurred in this section. Please try again."
      extra={[
        <Button key="retry" type="primary" onClick={reset}>
          Try Again
        </Button>,
        <Button key="home" onClick={() => router.push('/vi')}>
          Go to Home
        </Button>,
      ]}
    />
  );
}
