'use client';

import { Users, FolderKanban, Clock } from 'lucide-react';

export interface StatCardProps {
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
    <div className="h-[126px] p-6 border rounded-[15px] bg-white flex items-center gap-[18px] shadow-sm">
      <div
        className="w-[62px] h-[62px] rounded-[13px] flex items-center justify-center flex-shrink-0"
        style={{ background: style.bg }}
      >
        {icon ?? <Users style={{ color: style.color, width: 30, height: 30 }} />}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-[#566579] mb-1">{title}</div>
        <div className="text-[30px] font-extrabold leading-none mb-[10px] text-[#0f172a]">{value}</div>
        <div className="text-[13px] font-medium text-[#64748b]">{description}</div>
      </div>
    </div>
  );
}

interface AdminStatGridProps {
  cards: StatCardProps[];
}

export function AdminStatGrid({ cards }: AdminStatGridProps) {
  return (
    <div className="grid grid-cols-4 gap-[18px] mb-6">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}
