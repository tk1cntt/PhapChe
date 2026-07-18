'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Home, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

interface InviteInfo {
  id: string;
  email: string;
  role: 'admin' | 'specialist' | 'viewer';
  partnerName?: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin - Quản trị viên',
  specialist: 'Specialist - Chuyên viên',
  viewer: 'Viewer - Người xem',
};

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const token = params.token as string;

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ');
      setLoading(false);
      return;
    }

    setInviteInfo({
      id: token,
      email: 'invited@example.com',
      role: 'specialist',
      partnerName: 'Đối tác Pháp Chế',
    });
    setLoading(false);
  }, [token]);

  const handleAccept = async () => {
    if (!session) {
      router.push(`/sign-in?callbackUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/partner/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể chấp nhận lời mời');
      }

      setAccepted(true);
      setSuccessMsg('Chào mừng bạn gia nhập đội ngũ!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    router.push('/');
  };

  const containerClass = 'min-h-screen flex items-center justify-center';
  const cardClass = 'panel';
  const cardStyle: React.CSSProperties = { maxWidth: 448, width: '100%' };

  // Loading state
  if (loading) {
    return (
      <div className={containerClass}>
        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Accepted state
  if (accepted) {
    return (
      <div className={containerClass}>
        <div className={cardClass} style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-success-muted)', color: 'var(--color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle size={36} />
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 12 }}>Chào mừng bạn!</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>
            {successMsg || 'Bạn đã trở thành thành viên của đội ngũ. Hãy bắt đầu công việc.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => router.push('/dashboard')}>
              Đi đến Dashboard
            </button>
            <button className="btn-ghost" onClick={() => router.push('/')}>
              <Home size={16} />
              Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={containerClass}>
        <div className={cardClass} style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-danger-muted)', color: 'var(--color-danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <XCircle size={36} />
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 12 }}>Không thể chấp nhận lời mời</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>{error}</p>
          <button className="btn-primary" onClick={() => router.push('/')}>
            <Home size={16} />
            Đi đến trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Main invite accept view
  return (
    <div className={containerClass}>
      <div className={cardClass} style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 8 }}>Lời mời tham gia</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Bạn đã được mời tham gia một đội ngũ
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '16px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {inviteInfo?.partnerName && (
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: 4 }}>Tổ chức</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{inviteInfo.partnerName}</div>
            </div>
          )}

          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: 4 }}>Vai trò được mời</div>
            <span className="badge badge-blue">{roleLabels[inviteInfo?.role || 'specialist']}</span>
          </div>

          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: 4 }}>Quyền hạn</div>
            <ul style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', paddingLeft: 20, margin: 0 }}>
              {inviteInfo?.role === 'admin' && (
                <>
                  <li>Quản lý thành viên</li>
                  <li>Quản lý yêu cầu</li>
                  <li>Quản lý tài liệu</li>
                </>
              )}
              {inviteInfo?.role === 'specialist' && (
                <>
                  <li>Xem và quản lý yêu cầu</li>
                  <li>Xem và quản lý tài liệu</li>
                </>
              )}
              {inviteInfo?.role === 'viewer' && (
                <>
                  <li>Chỉ xem yêu cầu</li>
                  <li>Chỉ xem tài liệu</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '16px 0' }} />

        {!isPending && !session && (
          <div style={{
            background: 'var(--color-info-muted)', border: '1px solid var(--color-info)',
            borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 16,
          }}>
            <p style={{ color: 'var(--color-info)', fontSize: 'var(--text-sm)', margin: 0 }}>
              Bạn cần đăng nhập để chấp nhận lời mời này.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button className="btn-ghost" onClick={handleDecline}>
            Từ chối
          </button>
          <button
            className="btn-primary"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting && (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            )}
            {!session ? 'Đăng nhập và chấp nhận' : 'Chấp nhận lời mời'}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
