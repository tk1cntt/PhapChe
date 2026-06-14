'use client';

interface StatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'purple';
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

const variantStyles = {
  blue: {
    iconColor: '#2563eb',
    background: 'linear-gradient(135deg, #dfe8ff, #eef4ff)',
  },
  green: {
    iconColor: '#0f766e',
    background: 'linear-gradient(135deg, #d4f4ed, #eefbf8)',
  },
  orange: {
    iconColor: '#f97316',
    background: 'linear-gradient(135deg, #ffe2bf, #fff1df)',
  },
  purple: {
    iconColor: '#7c3aed',
    background: 'linear-gradient(135deg, #ede9fe, #f5f3ff)',
  },
};

export default function StatCard({
  variant,
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{
          color: styles.iconColor,
          background: styles.background,
        }}
      >
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-desc">{description}</div>
      </div>
    </div>
  );
}
