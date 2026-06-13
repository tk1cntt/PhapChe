'use client';

import { useTranslations } from 'next-intl';

export interface AuditStats {
  totalEvents: number;
  criticalCount: number;
  completeAuditPercent: number;
  workspaceCount: number;
}

interface AdminAuditStatsProps {
  stats: AuditStats;
}

export function AdminAuditStats({ stats }: AdminAuditStatsProps) {
  const t = useTranslations('AuditEvents');

  const validActions = Math.max(0, stats.totalEvents - stats.criticalCount);
  const warnings = stats.criticalCount > 0 ? Math.min(stats.criticalCount, 10) : 0;

  const cards = [
    {
      title: t('statTotalEvents'),
      value: stats.totalEvents,
      description: 'Trong 30 ngày gần nhất',
      variant: 'blue' as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M4 4v15.5" />
          <path d="M8 4h12v13H8z" />
        </svg>
      ),
    },
    {
      title: 'Thao tac hop le',
      value: validActions,
      description: 'Da ghi nhan day du',
      variant: 'green' as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ),
    },
    {
      title: 'Can ra soat',
      value: stats.criticalCount,
      description: 'Lien quan quyen truy cap',
      variant: 'orange' as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      title: 'Canh bao',
      value: warnings,
      description: 'Bat thuong hoac bi tu choi',
      variant: 'red' as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 18,
        marginBottom: 24,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            height: 126,
            background: '#fff',
            border: '1px solid #dfe7f1',
            borderRadius: 15,
            display: 'flex',
            alignItems: 'center',
            padding: '24px 22px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
            position: 'relative',
          }}
        >
          <div
            className={`stat-icon ${card.variant}`}
            style={{
              width: 62,
              height: 62,
              borderRadius: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 18,
            }}
          >
            <div style={{ width: 30, height: 30 }}>{card.icon}</div>
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                color: '#566579',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 1,
                marginBottom: 10,
                color: '#0f172a',
              }}
            >
              {card.value.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              {card.description}
            </div>
          </div>
        </div>
      ))}
      <style>{`
        .stat-icon.blue {
          color: #2563eb;
          background: linear-gradient(135deg, #dfe8ff, #eef4ff);
        }
        .stat-icon.orange {
          color: #f97316;
          background: linear-gradient(135deg, #ffe2bf, #fff1df);
        }
        .stat-icon.green {
          color: #0f766e;
          background: linear-gradient(135deg, #d4f4ed, #eefbf8);
        }
        .stat-icon.red {
          color: #ef4444;
          background: linear-gradient(135deg, #ffe4e6, #fff1f2);
        }
      `}</style>
    </div>
  );
}
