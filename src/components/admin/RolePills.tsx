'use client';

interface RolePillsProps {
  roleStats: Record<string, number>;
  pendingCount: number;
  translations: {
    role_customer: string;
    role_specialist: string;
    role_reviewer: string;
    role_coordinator_admin: string;
    role_super_admin: string;
    role_audit_admin: string;
    pendingLabel: string;
  };
}

const roleColors: Record<string, { bg: string; color: string }> = {
  customer: { bg: '#dbeafe', color: '#2563eb' },
  specialist: { bg: '#dbeafe', color: '#2563eb' },
  reviewer: { bg: '#ffedd5', color: '#ea580c' },
  coordinator_admin: { bg: '#ccfbf1', color: '#0f766e' },
  super_admin: { bg: '#ffe4e6', color: '#ef4444' },
  audit_admin: { bg: '#ede9fe', color: '#7c3aed' },
};

const ROLES = ['customer', 'specialist', 'reviewer', 'coordinator_admin', 'super_admin', 'audit_admin'];

export default function RolePills({ roleStats, pendingCount, translations }: RolePillsProps) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dfe7f1',
      borderRadius: 15,
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
      padding: 24,
      marginBottom: 24,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 20,
        fontWeight: 800,
        marginBottom: 18,
        color: '#0f172a',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        System Roles
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
        {ROLES.map((role) => {
          const c = roleColors[role] || roleColors.customer;
          const count = roleStats[role] || 0;
          const labelKey = `role_${role}` as keyof typeof translations;
          const label = translations[labelKey] || role;

          return (
            <div
              key={role}
              style={{
                height: 38,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 15px',
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                background: c.bg,
                color: c.color,
              }}
            >
              {label} ({role})
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.65)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                }}
              >
                {count}
              </span>
            </div>
          );
        })}

        {/* Pending pill */}
        <div
          style={{
            height: 38,
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 15px',
            fontSize: 13,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            background: '#ede9fe',
            color: '#7c3aed',
          }}
        >
          {translations.pendingLabel || 'Invited / Pending'}
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.65)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
            }}
          >
            {pendingCount}
          </span>
        </div>
      </div>

      <p style={{ color: '#59687e', fontSize: 14, fontWeight: 500, lineHeight: 1.7, margin: 0 }}>
        User/role/workspace changes call createAdminUser, updateAdminUserRole, deactivateAdminUser,
        assignUserToWorkspace and are audited with actor, correlationId and metadataSummary.
      </p>
    </div>
  );
}
