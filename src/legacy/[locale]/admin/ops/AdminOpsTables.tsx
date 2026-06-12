'use client';

import Link from 'next/link';
import type { RequestStatus } from '@/lib/types';
import { useTranslations } from 'next-intl';

const statusColors: Record<RequestStatus, { bg: string; color: string; dot: string; labelKey: string }> = {
  draft_intake: { bg: '#f3f4f6', color: '#4b5563', dot: '#6b7280', labelKey: 'draft_intake' },
  intake_submitted: { bg: '#dbeafe', color: '#2563eb', dot: '#2563eb', labelKey: 'intake_submitted' },
  triage: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316', labelKey: 'triage' },
  assigned: { bg: '#dbeafe', color: '#2563eb', dot: '#2563eb', labelKey: 'assigned' },
  in_progress: { bg: '#dbeafe', color: '#2563eb', dot: '#2563eb', labelKey: 'in_progress' },
  pending_review: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316', labelKey: 'pending_review' },
  revision_required: { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444', labelKey: 'revision_required' },
  approved: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981', labelKey: 'approved' },
  delivered: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981', labelKey: 'delivered' },
  closed: { bg: '#f3f4f6', color: '#4b5563', dot: '#6b7280', labelKey: 'closed' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444', labelKey: 'cancelled' },
};

export type OpsRequestRow = {
  id: string;
  title: string;
  status: RequestStatus;
  workspaceId: string;
  matterTypeKey: string | null;
  matterTypeLabel: string | null;
  customerName: string;
  customerEmail: string;
  assignedSpecialistName: string | null;
  assignedReviewerName: string | null;
  createdAt: string;
  currentStatusAgeDays: number;
};

export type OpsWorkloadRow = {
  kind: 'specialist' | 'reviewer';
  userId: string;
  name: string;
  email: string;
  activeCount: number;
  byStatus: Array<{ status: RequestStatus; count: number }>;
  oldestActiveAgeDays: number;
};

export type OpsTimelineEvent = {
  id: string;
  title: string;
  description: string;
  time: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function roleLabel(kind: string): string {
  switch (kind) {
    case 'specialist': return 'Specialist';
    case 'reviewer': return 'Reviewer';
    case 'coordinator': return 'Coordinator';
    case 'audit': return 'Audit';
    default: return kind;
  }
}

function getSLAInfo(status: RequestStatus, ageDays: number): { pct: number; timeLeft: string; class: string } {
  // Mock SLA logic based on status and age
  if (status === 'delivered' || status === 'closed' || status === 'approved') {
    return { pct: 100, timeLeft: 'Hoàn tất', class: 'sla-ok' };
  }
  if (status === 'revision_required' || status === 'cancelled') {
    return { pct: 90, timeLeft: 'Cần xử lý', class: 'sla-danger' };
  }
  if (ageDays > 5) {
    return { pct: 92, timeLeft: 'Còn 2h', class: 'sla-danger' };
  }
  if (ageDays > 3) {
    return { pct: 75, timeLeft: 'Còn 6h', class: 'sla-warn' };
  }
  if (ageDays > 1) {
    return { pct: 56, timeLeft: 'Còn 12h', class: 'sla-ok' };
  }
  return { pct: 30, timeLeft: 'Còn 24h', class: 'sla-ok' };
}

function getPriorityInfo(status: RequestStatus): { label: string; class: string; bg: string; color: string } {
  if (status === 'revision_required' || status === 'cancelled') {
    return { label: 'Cao', class: 'red', bg: '#ffe4e6', color: '#ef4444' };
  }
  if (status === 'pending_review' || status === 'triage') {
    return { label: 'Vừa', class: 'orange', bg: '#ffedd5', color: '#ea580c' };
  }
  return { label: 'Thấp', class: 'green', bg: '#ccfbf1', color: '#0f766e' };
}

function getActionLink(status: RequestStatus, t: any): { text: string; href: string } {
  if (status === 'triage' || status === 'assigned') {
    return { text: t('actionCoordinate'), href: '#' };
  }
  if (status === 'pending_review' || status === 'revision_required') {
    return { text: t('actionAudit'), href: '#' };
  }
  if (status === 'in_progress') {
    return { text: t('actionProcess'), href: '#' };
  }
  return { text: t('actionView'), href: '#' };
}

export function WorkloadPanel({ workload, maxCapacity = 20 }: { workload: OpsWorkloadRow[]; maxCapacity?: number }) {
  const t = useTranslations('AdminOpsTables');
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dfe7f1',
      borderRadius: 15,
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
      padding: 24,
    }}>
      <div style={{
        fontSize: 20,
        fontWeight: 800,
        color: '#0f172a',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 3 3 6-8" />
        </svg>
        {t('workloadOverview')}
      </div>
      <div style={{ display: 'grid', gap: 14 }}>
        {workload.map((row) => {
          const pct = Math.min(100, Math.round((row.activeCount / maxCapacity) * 100));
          return (
            <div key={`${row.kind}-${row.userId}`} style={{
              display: 'grid',
              gridTemplateColumns: '190px 1fr 70px',
              gap: 14,
              alignItems: 'center',
              padding: 14,
              border: '1px solid #edf2f7',
              borderRadius: 12,
              background: '#fbfdff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#eef2f7',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                }}>
                  {getInitials(row.name || row.email)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    {row.name || row.email}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{roleLabel(row.kind)}</div>
                </div>
              </div>
              <div style={{
                height: 10,
                background: '#eaf0f6',
                borderRadius: 999,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #0b8f86, #22c55e)',
                }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                {row.activeCount} {t('filesUnit')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimelinePanel({ events }: { events: OpsTimelineEvent[] }) {
  const t = useTranslations('AdminOpsTables');
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dfe7f1',
      borderRadius: 15,
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
      padding: 24,
    }}>
      <div style={{
        fontSize: 20,
        fontWeight: 800,
        color: '#0f172a',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        {t('timelineAudit')}
      </div>
      <div style={{ position: 'relative', display: 'grid', gap: 18 }}>
        {/* connector line */}
        <div style={{
          position: 'absolute',
          left: 13,
          top: 8,
          bottom: 8,
          width: 2,
          background: '#e2e8f0',
        }} />
        {events.map((ev) => (
          <div key={ev.id} style={{ position: 'relative', paddingLeft: 38 }}>
            <div style={{
              position: 'absolute',
              left: 5,
              top: 4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#087f78',
              border: '4px solid #d9f8f4',
              zIndex: 2,
            }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>
              {ev.title}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              {ev.description}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 600 }}>
              {ev.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOpsTable({ requests }: { requests: OpsRequestRow[] }) {
  const t = useTranslations('AdminOpsTables');
  const tStatus = useTranslations('RequestStatus');

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dfe7f1',
      borderRadius: 15,
      boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
      overflow: 'hidden',
    }}>
      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '0.9fr 1.15fr 1fr 1.05fr 0.9fr 0.95fr 1fr',
        background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
        borderBottom: '1px solid #dfe7f1',
      }}>
        <div style={{
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('colRequestCode')}
        </div>
        <div style={{
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('colWorkspace')}
        </div>
        <div style={{
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('colStatus')}
        </div>
        <div style={{
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          SLA
        </div>
        <div style={{
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('colPriority')}
        </div>
        <div style={{
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('colAssignee')}
        </div>
        <div style={{
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
        }}>
          {t('colActions')}
        </div>
      </div>

      {/* Table Rows */}
      {requests.map((row) => {
        const statusStyle = statusColors[row.status];
        const sla = getSLAInfo(row.status, row.currentStatusAgeDays);
        const priority = getPriorityInfo(row.status);
        const action = getActionLink(row.status, t);
        const assignee = row.assignedSpecialistName || row.assignedReviewerName || tStatus('statusUnassigned');
        const assigneeRole = row.assignedSpecialistName ? 'Specialist' : row.assignedReviewerName ? 'Reviewer' : '';

        return (
          <div
            key={row.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '0.9fr 1.15fr 1fr 1.05fr 0.9fr 0.95fr 1fr',
              minHeight: 68,
              borderBottom: '1px solid #dfe7f1',
              background: '#fff',
              transition: '0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fbfdff'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
          >
            {/* Mã hồ sơ */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              fontSize: 14,
              color: '#0f172a',
              fontWeight: 500,
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 800 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}>
                  📄
                </div>
                {row.title || row.id}
              </div>
            </div>

            {/* Workspace */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              fontSize: 14,
              color: '#0f172a',
              fontWeight: 500,
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>
                  {row.customerName}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{row.workspaceId}</div>
              </div>
            </div>

            {/* Trạng thái */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              fontSize: 14,
              color: '#0f172a',
              fontWeight: 500,
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 28,
                padding: '0 11px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                background: statusStyle.bg,
                color: statusStyle.color,
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  marginRight: 7,
                  background: statusStyle.dot,
                  display: 'inline-block',
                }} />
                {tStatus(row.status)}
              </span>
            </div>

            {/* SLA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              fontSize: 14,
              color: '#0f172a',
              fontWeight: 500,
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#64748b',
                  fontWeight: 700,
                }}>
                  <span>{sla.timeLeft}</span>
                  <span>{sla.pct}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 999,
                  background: '#eaf0f6',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    display: 'block',
                    height: '100%',
                    width: `${sla.pct}%`,
                    borderRadius: 999,
                    background: sla.class === 'sla-ok' ? '#10b981' : sla.class === 'sla-warn' ? '#f97316' : '#ef4444',
                  }} />
                </div>
              </div>
            </div>

            {/* Ưu tiên */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              fontSize: 14,
              color: '#0f172a',
              fontWeight: 500,
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 28,
                padding: '0 11px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                background: priority.bg,
                color: priority.color,
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  marginRight: 7,
                  background: priority.color,
                  display: 'inline-block',
                }} />
                {priority.label}
              </span>
            </div>

            {/* Phụ trách */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              fontSize: 14,
              color: '#0f172a',
              fontWeight: 500,
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>
                  {assignee}
                </div>
                {assigneeRole && <div style={{ fontSize: 12, color: '#64748b' }}>{assigneeRole}</div>}
              </div>
            </div>

            {/* Thao tác */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              fontSize: 14,
              color: '#0f172a',
              fontWeight: 500,
              minWidth: 0,
            }}>
              <Link
                href={action.href}
                style={{
                  color: '#087f78',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {action.text}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
