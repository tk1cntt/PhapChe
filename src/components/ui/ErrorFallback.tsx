'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const t = useTranslations('Common');
  const router = useRouter();

  useEffect(() => {
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
    <div className="panel" style={{ maxWidth: 480, margin: '48px auto', textAlign: 'center', padding: 48 }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--color-danger-muted)', color: 'var(--color-danger)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <AlertTriangle size={32} />
      </div>
      <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 12 }}>
        {t('errorTitle')}
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 24, lineHeight: 1.6 }}>
        {error.message || t('errorMessage')}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn-primary" onClick={handleRetry}>
          <RefreshCw size={16} />
          {t('retry')}
        </button>
        <button className="btn-ghost" onClick={handleGoHome}>
          <Home size={16} />
          {t('goHome')}
        </button>
      </div>
    </div>
  );
}
