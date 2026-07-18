'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, CheckCircle, Clock, Settings, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';
import { FormattedDate } from '@/components/shared/ui/FormattedDate';

interface PartnerDashboardClientProps {
  currentUserId: string;
  currentUserRole: string;
  partnerName: string;
  memberCount: number;
}

interface RequestSummary {
  total: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
}

interface RecentRequest {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

const statusBadgeClass: Record<string, string> = {
  in_progress: 'badge-blue',
  pending_review: 'badge-orange',
  approved: 'badge-green',
  delivered: 'badge-green',
  completed: 'badge-green',
  cancelled: 'badge-red',
  draft_intake: 'badge-green',
  triage: 'badge-orange',
  assigned: 'badge-blue',
  revision_required: 'badge-orange',
};


export function PartnerDashboardClient({
  currentUserId,
  currentUserRole,
  partnerName,
  memberCount,
}: PartnerDashboardClientProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RequestSummary>({
    total: 0, inProgress: 0, pendingReview: 0, completed: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);

  const t = useTranslations('PartnerDashboard');
  const isAdmin = currentUserRole === 'admin';

  const statusLabels: Record<string, string> = {
    in_progress: t('statusInProgress'),
    pending_review: t('statusPendingReview'),
    approved: t('statusApproved'),
    delivered: t('statusDelivered'),
    completed: t('statusCompleted'),
    cancelled: t('statusCancelled'),
    draft_intake: t('statusDraftIntake'),
    triage: t('statusTriage'),
    assigned: t('statusAssigned'),
    revision_required: t('statusRevisionRequired'),
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/partner/requests?limit=5');
        if (response.ok) {
          const data = await response.json();
          setRecentRequests(data.data || []);

          const allResponse = await fetch('/api/partner/requests?limit=100');
          if (allResponse.ok) {
            const allData = await allResponse.json();
            const requests = allData.data || [];
            setStats({
              total: requests.length,
              inProgress: requests.filter((r: RecentRequest) => r.status === 'in_progress').length,
              pendingReview: requests.filter((r: RecentRequest) => r.status === 'pending_review').length,
              completed: requests.filter(
                (r: RecentRequest) => r.status === 'approved' || r.status === 'delivered' || r.status === 'completed'
              ).length,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const roleBadgeClass = isAdmin ? 'badge-purple' : currentUserRole === 'specialist' ? 'badge-blue' : 'badge-green';
  const roleLabel = isAdmin ? 'Admin' : currentUserRole === 'specialist' ? 'Specialist' : 'Viewer';

  if (loading) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 48, minHeight: 400 }}>
        <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
        <div className="skeleton skeleton-card" style={{ width: '100%' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '0 0 4px' }}>{t('pageTitle')}</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--text-sm)' }}>{partnerName}</p>
        </div>
        <span className={`badge ${roleBadgeClass}`}>{roleLabel}</span>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {([
          { key: 'total', label: t('statTotal'), icon: FileText, variant: 'blue' as const },
          { key: 'inProgress', label: t('statInProgress'), icon: Clock, variant: 'blue' as const },
          { key: 'pendingReview', label: t('statPendingReview'), icon: Clock, variant: 'orange' as const },
          { key: 'completed', label: t('statCompleted'), icon: CheckCircle, variant: 'green' as const },
        ]).map((sc) => {
          const Icon = sc.icon;
          return (
            <div key={sc.key} className="stat-card">
              <div className={`stat-icon ${sc.variant}`}><Icon size={28} /></div>
              <div className="stat-content">
                <div className="stat-title">{sc.label}</div>
                <div className="stat-value">{stats[sc.key as keyof RequestSummary]}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-title">
          <div className="panel-title-left">{t('quickActions')}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isAdmin && (
            <Link href="/vi/partner/settings">
              <button className="btn-primary">
                <Settings size={16} />
                {t('manageMembers')}
              </button>
            </Link>
          )}
          <Link href="/vi/partner/requests">
            <button className="btn-ghost">
              <FileText size={16} />
              {t('viewAllRequests')}
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-title">
          <div className="panel-title-left">{t('recentRequests')}</div>
          <Link href="/vi/partner/requests" className="small-link">
            {t('viewAll')} <ArrowRight size={14} />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>
            {t('noRequests')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentRequests.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 12, border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                      {item.title || `${t('requestPrefix')} ${item.id.slice(0, 8)}`}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {t('updated')}: <FormattedDate date={item.updatedAt} variant="date" />
                    </div>
                  </div>
                </div>
                <span className={`badge ${statusBadgeClass[item.status] || 'badge-green'}`}>
                  {statusLabels[item.status] || item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">{t('adminSection')}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="panel" style={{ boxShadow: 'none', border: '1px solid var(--color-border-soft)' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 12 }}>{t('members')}</div>
              <div style={{ fontSize: 31, fontWeight: 800, marginBottom: 12 }}>{memberCount}</div>
              <Link href="/vi/partner/settings" className="small-link">
                {t('manageMembersLink')}
              </Link>
            </div>
            <div className="panel" style={{ boxShadow: 'none', border: '1px solid var(--color-border-soft)' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 12 }}>{t('invitations')}</div>
              <div style={{ fontSize: 31, fontWeight: 800, marginBottom: 12 }}>—</div>
              <Link href="/vi/partner/settings?tab=invites" className="small-link">
                {t('sendInvite')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
