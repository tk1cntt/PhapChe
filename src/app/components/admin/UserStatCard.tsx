'use client';

interface UserStatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'purple';
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
  purple: {
    iconColor: '#7c3aed',
    background: 'linear-gradient(135deg, #ede9fe, #f5f3ff)',
  },
};

export default function UserStatCard({
  variant,
  title,
  value,
  description,
  icon,
}: UserStatCardProps) {
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
        position: 'relative',
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
      <div
        data-testid="info-dot"
        style={{
          position: 'absolute',
          top: 22,
          right: 22,
          width: 21,
          height: 21,
          borderRadius: '50%',
          background: '#f1f5f9',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        i
      </div>
    </div>
  );
}
