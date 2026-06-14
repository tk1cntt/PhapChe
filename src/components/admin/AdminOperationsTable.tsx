'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { OpsRequestRowDto } from '@/lib/ops/ops-service';

interface AdminOperationsTableProps {
  requests: OpsRequestRowDto[];
  loading?: boolean;
}

const slaBarColor: Record<string, string> = {
  ok: '#10b981',
  warn: '#f97316',
  danger: '#ef4444',
};

export function AdminOperationsTable({ requests, loading }: AdminOperationsTableProps) {
  const params = useParams();
  const locale = params.locale as string ?? 'vi';
  const t = useTranslations('AdminOps');
  const tStatus = useTranslations('RequestStatus');

  const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
    intake_submitted: { bg: '#dbeafe', color: '#2563eb', label: tStatus('intake_submitted') },
    triage: { bg: '#dbeafe', color: '#2563eb', label: tStatus('triage') },
    assigned: { bg: '#ffedd5', color: '#ea580c', label: tStatus('assigned') },
    in_progress: { bg: '#ede9fe', color: '#7c3aed', label: tStatus('in_progress') },
    pending_review: { bg: '#ffedd5', color: '#ea580c', label: tStatus('pending_review') },
    revision_required: { bg: '#ffe4e6', color: '#ef4444', label: tStatus('revision_required') },
    approved: { bg: '#ccfbf1', color: '#0f766e', label: tStatus('approved') },
    delivered: { bg: '#ccfbf1', color: '#087f78', label: tStatus('delivered') },
    closed: { bg: '#ccfbf1', color: '#0f766e', label: tStatus('closed') },
    cancelled: { bg: '#ffe4e6', color: '#ef4444', label: tStatus('cancelled') },
    draft_intake: { bg: '#f1f5f9', color: '#64748b', label: tStatus('draft_intake') },
  };

  const priorityBadge: Record<string, { bg: string; color: string; label: string }> = {
    HIGH: { bg: '#ffe4e6', color: '#ef4444', label: t('priorityHigh') },
    MEDIUM: { bg: '#ffedd5', color: '#ea580c', label: t('priorityMedium') },
    LOW: { bg: '#ccfbf1', color: '#0f766e', label: t('priorityLow') },
  };

  const GRID = '0.9fr 1.15fr 1fr 1.05fr 0.9fr 0.95fr 1fr';

  const TABLE_HEADERS = [
    t('requestCode'),
    t('workspace'),
    t('status'),
    t('slaColumn'),
    t('priorityColumn'),
    t('specialist'),
    t('action'),
  ];

  function getActionLink(req: OpsRequestRowDto): { label: string; href: string } {
    const closedStatuses = ['closed', 'cancelled', 'delivered'];
    if (closedStatuses.includes(req.status)) {
      return { label: t('viewAudit'), href: `/${locale}/admin/audit?requestId=${req.id}` };
    }
    if (req.sla?.level === 'danger') {
      return { label: t('processNow'), href: `/${locale}/admin/requests/${req.id}` };
    }
    return { label: t('dispatch'), href: `/${locale}/admin/requests/${req.id}` };
  }

  function TableRow({ req }: { req: OpsRequestRowDto }) {
    const st = statusBadge[req.status] ?? { bg: '#f1f5f9', color: '#64748b', label: req.status };
    const pr = priorityBadge[req.priority ?? ''] ?? { bg: '#f1f5f9', color: '#64748b', label: '—' };
    const sla = req.sla ?? { level: 'info' as const, label: t('noSla'), percent: 0 };
    const barColor = slaBarColor[sla.level] ?? '';
    const action = getActionLink(req);
    const assigneeName = req.assignedSpecialistName ?? req.assignedReviewerName ?? '—';
    const assigneeRole = req.assignedSpecialistName ? 'Specialist' : req.assignedReviewerName ? 'Reviewer' : '';

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          minHeight: 68,
          borderBottom: '1px solid #dfe7f1',
          background: '#fff',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fbfdff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, borderRight: '1px solid #dfe7f1' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            📄
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {req.code ?? req.id.slice(-8).toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', borderRight: '1px solid #dfe7f1' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{req.workspaceName ?? '—'}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', borderRight: '1px solid #dfe7f1' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 28, padding: '0 11px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', borderRight: '1px solid #dfe7f1' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', fontWeight: 700 }}>
              <span>{sla.label}</span>
              <span>{sla.percent}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#eaf0f6', overflow: 'hidden' }}>
              {sla.level !== 'info' && (
                <div style={{ height: '100%', borderRadius: 999, width: `${sla.percent}%`, background: barColor }} />
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', borderRight: '1px solid #dfe7f1' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 28, padding: '0 11px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: pr.bg, color: pr.color }}>
            {pr.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', borderRight: '1px solid #dfe7f1' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{assigneeName}</div>
            {assigneeRole && (
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{assigneeRole}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px' }}>
          <a href={action.href} style={{ color: '#087f78', fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {action.label}
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: '#fff', border: '1px solid #dfe7f1', borderRadius: 15, padding: 48, textAlign: 'center', color: '#64748b', boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)' }}>
        {t('loading')}
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #dfe7f1', borderRadius: 15, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)', overflow: 'hidden', marginBottom: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderBottom: '1px solid #dfe7f1',
          minHeight: 54,
        }}
      >
        {TABLE_HEADERS.map((header) => (
          <div
            key={header}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              color: '#59687e',
              fontSize: 14,
              fontWeight: 700,
              borderRight: '1px solid #dfe7f1',
            }}
          >
            {header}
          </div>
        ))}
      </div>

      {requests.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
          <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
            {t('noRequests')}
          </div>
          <div>{t('noRequestsHint')}</div>
        </div>
      ) : (
        requests.map((req) => <TableRow key={req.id} req={req} />)
      )}
    </div>
  );
}
