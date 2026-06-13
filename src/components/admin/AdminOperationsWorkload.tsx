'use client';

import type { OpsWorkloadRowDto } from '@/lib/ops/ops-service';

interface AdminOperationsWorkloadProps {
  workload: OpsWorkloadRowDto[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function WorkloadItem({ item }: { item: OpsWorkloadRowDto }) {
  const maxActive = 20; // normalize progress bar to max 20 active items
  const progress = Math.min(100, Math.round((item.activeCount / maxActive) * 100));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '190px 1fr 70px',
        gap: 14,
        alignItems: 'center',
        padding: 14,
        border: '1px solid #edf2f7',
        borderRadius: 12,
        background: '#fbfdff',
      }}
    >
      {/* Person */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
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
            flexShrink: 0,
          }}
        >
          {getInitials(item.name)}
        </div>
        <div>
          <strong style={{ display: 'block', fontSize: 14, marginBottom: 4, color: '#0f172a' }}>
            {item.name}
          </strong>
          <span style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>
            {item.kind}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 10,
          background: '#eaf0f6',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 999,
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #0b8f86, #22c55e)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Count */}
      <div
        style={{
          textAlign: 'right',
          fontSize: 14,
          fontWeight: 800,
          color: '#0f172a',
        }}
      >
        {item.activeCount} hồ sơ
      </div>
    </div>
  );
}

export function AdminOperationsWorkload({ workload }: AdminOperationsWorkloadProps) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {workload.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 14,
          }}
        >
          Chưa có workload nào
        </div>
      ) : (
        workload.map((item) => <WorkloadItem key={item.userId} item={item} />)
      )}
    </div>
  );
}
