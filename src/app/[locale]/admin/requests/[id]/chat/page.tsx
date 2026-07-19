'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatActivityPanel } from '@/components/admin/ChatActivityPanel';

interface RequestInfo {
  title: string;
  matterTypeKey: string | null;
}

export default function ChatActivityPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const locale = (params.locale as string) || 'vi';

  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/requests/${requestId}`);

        if (!res.ok) {
          if (res.status === 404) throw new Error('Request not found');
          throw new Error('Failed to load request');
        }

        const data = await res.json();
        if (cancelled) return;

        // Handle both envelope formats
        const req = data.data ?? data;
        setRequestInfo({
          title: req.title ?? 'Request',
          matterTypeKey: req.matterTypeKey ?? req.intakeSubmission?.matterTypeKey ?? null,
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [requestId]);

  const handleBack = () => {
    router.push(`/${locale}/admin/requests`);
  };

  if (loading) {
    return (
      <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-height))' }}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Loading...</div>
      </div>
    );
  }

  if (error || !requestInfo) {
    return (
      <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-height))', gap: 'var(--space-md)' }}>
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>Error</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{error || 'Request not found'}</div>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Back to requests
        </button>
      </div>
    );
  }

  return (
    <ChatActivityPanel
      requestId={requestId}
      requestTitle={requestInfo.title}
      matterTypeKey={requestInfo.matterTypeKey}
      onBack={handleBack}
    />
  );
}
