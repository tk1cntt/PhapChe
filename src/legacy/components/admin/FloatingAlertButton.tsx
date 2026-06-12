'use client';

interface FloatingAlertButtonProps {
  alertCount?: number;
  onClick?: () => void;
}

export default function FloatingAlertButton({
  alertCount = 3,
  onClick,
}: FloatingAlertButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        right: 22,
        bottom: 20,
        minWidth: 118,
        height: 48,
        borderRadius: 999,
        background: 'linear-gradient(180deg, #ef4444, #dc2626)',
        color: '#fff',
        border: '3px solid #facc15',
        boxShadow: '0 12px 26px rgba(15, 23, 42, 0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontWeight: 800,
        padding: '0 14px',
        cursor: 'pointer',
        zIndex: 1000,
      }}
    >
      {/* Left Icon Circle */}
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}
      >
        N
      </span>
      {/* Alert Count Text */}
      <span>{alertCount} Alerts</span>
    </button>
  );
}
