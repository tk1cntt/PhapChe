'use client';

import { Users, FolderKanban, Clock } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const variants = {
  blue: { bg: 'linear-gradient(135deg, #dfe8ff, #eef4ff)', color: '#2563eb', border: '#dfe7f1' },
  green: { bg: 'linear-gradient(135deg, #d4f4ed, #eefbf8)', color: '#0f766e', border: '#dfe7f1' },
  orange: { bg: 'linear-gradient(135deg, #ffedd5, #fff7ed)', color: '#ea580c', border: '#dfe7f1' },
  red: { bg: 'linear-gradient(135deg, #fee2e2, #fef2f2)', color: '#dc2626', border: '#dfe7f1' },
  purple: { bg: 'linear-gradient(135deg, #ede9fe, #f5f3ff)', color: '#7c3aed', border: '#dfe7f1' },
};

export function StatCard({ title, value, description, icon, variant = 'blue' }: StatCardProps) {
  const style = variants[variant];
  return (
    <div style={{
      height: 126,
      padding: '24px 22px',
      borderRadius: 15,
      border: `1px solid ${style.border}`,
      background: '#ffffff',
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
    }}>
      <div style={{
        width: 62,
        height: 62,
        borderRadius: 13,
        background: style.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon ?? <Users style={{ color: style.color, width: 30, height: 30 }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#020617', lineHeight: 1, marginBottom: 10 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>{description}</div>
      </div>
    </div>
  );
}

interface AdminStatGridProps {
  cards: StatCardProps[];
}

export function AdminStatGrid({ cards }: AdminStatGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 18,
      marginBottom: 24,
    }}>
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}
