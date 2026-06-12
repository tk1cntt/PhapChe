'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function CustomerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (error.message === 'UNAUTHENTICATED') {
      // Extract locale from pathname (e.g. /vi/customer → vi)
      const segments = pathname.split('/').filter(Boolean);
      const locale = segments[0] || 'vi';
      router.push(`/${locale}/sign-in`);
    }
  }, [error, router, pathname]);

  return null;
}
