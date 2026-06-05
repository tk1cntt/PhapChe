'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    if (error.message === 'UNAUTHENTICATED') {
      router.push('/sign-in');
    }
  }, [error, router]);

  return null;
}
