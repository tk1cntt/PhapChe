'use client';

import { useRouter } from 'next/navigation';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  // Handle auth errors - redirect to sign-in
  if (error.message === 'UNAUTHENTICATED') {
    router.push('/vi/sign-in');
    return null;
  }

  return <ErrorFallback error={error} onRetry={reset} />;
}
