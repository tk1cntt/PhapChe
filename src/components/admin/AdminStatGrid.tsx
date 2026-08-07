'use client';

export interface StatCardProps {
  id?: string;
  title: string;
  value: number | string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}
}
const variants = {
  blue: { bg: 'linear-gradient(135deg, #dfe8ff, #eef4ff)', color: 'var(--color-info)' },
  green: { bg: 'linear-gradient(135deg, #d4f4ed, #eefbf8)', color: 'var(--color-primary)' },
  orange: { bg: 'linear-gradient(135deg, #ffe2bf, #fff1df)', color: 'var(--color-warning)' },
  red: { bg: 'linear-gradient(135deg, #fee2e2, #fef2f2)', color: 'var(--color-danger)' },
  purple: { bg: 'linear-gradient(135deg, #ede9fe, #f5f3ff)', color: 'var(--color-accent)' },
};

const defaultIcons: Record<StatCardProps['variant'] & string, React.ReactNode> = {
  blue: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M9 13h6"/>
      <path d="M9 17h6"/>
    </svg>
  ),
  green: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  purple: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18"/>
      <path d="M5 21V7h6v14"/>
      <path d="M13 21V3h6v18"/>
    </svg>
  ),
  orange: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  red: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  ),
};

export function StatCard({ title, value, description, icon, variant = 'blue' }: StatCardProps) {
  const style = variants[variant] ?? variants.blue;
  return (
    <div data-testid="admin-stat-card" style={{
      height: 126,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 15,
      display: 'flex',
      alignItems: 'center',
      padding: '24px 22px',
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
      position: 'relative',
    }}>
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 18,
          background: style.bg,
          color: style.color,
          flexShrink: 0,
        }}
      >
        {icon ?? defaultIcons[variant] ?? defaultIcons.blue}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 10, color: 'var(--color-text)' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{description}</div>
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: 22,
        right: 22,
        width: 21,
        height: 21,
        borderRadius: '50%',
        border: '2px solid #cbd5e1',
        color: 'var(--color-text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 900,
      }}>i</div>
    </div>
  );
}

interface AdminStatGridProps {
  cards: StatCardProps[];
}

export function AdminStatGrid({ cards }: AdminStatGridProps) {
  return (
    <div data-testid="admin-requests-stats" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 18,
      marginBottom: 24,
    }}>
      {cards.map((card) => (
        <StatCard key={card.id ?? card.title} {...card} />
      ))}
    </div>
  );
}
