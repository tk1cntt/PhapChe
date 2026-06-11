'use client';

interface AdminStatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'red';
  title: string;
  value: string;
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
  red: {
    iconColor: '#ef4444',
    background: 'linear-gradient(135deg, #ffe4e6, #fff1f2)',
  },
};

export default function AdminStatCard({
  variant,
  title,
  value,
  description,
  icon,
}: AdminStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      style={{
        height: 126,
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 15,
        display: 'flex',
        alignItems: 'center',
        padding: '24px 22px',
        boxShadow: 'var(--soft-shadow)',
      }}
    >
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 18,
          color: styles.iconColor,
          background: styles.background,
        }}
      >
        {icon}
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
          {title}
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
          {value}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#64748b',
            fontWeight: 500,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
