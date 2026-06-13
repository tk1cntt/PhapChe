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

const ROLES = ['super_admin', 'audit_admin', 'coordinator_admin', 'reviewer', 'specialist', 'customer'];

export default function RolePills({ roleStats, pendingCount, translations }: RolePillsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-[15px] shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 text-[20px] font-extrabold mb-[18px] text-[#0f172a]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        {translations.pendingLabel ? 'System Roles' : 'System Roles'}
      </div>

      <div className="flex flex-wrap gap-[14px] mb-[18px]">
        {ROLES.map((role) => {
          const c = roleColors[role] || roleColors.customer;
          const count = roleStats[role] || 0;
          const labelKey = `role_${role}` as keyof typeof translations;
          const label = translations[labelKey] || role;

          return (
            <div
              key={role}
              className="inline-flex items-center gap-3 h-[38px] rounded-full px-[15px] text-[13px] font-extrabold whitespace-nowrap"
              style={{ background: c.bg, color: c.color }}
            >
              {label} ({count})
              <span
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px]"
                style={{ background: 'rgba(255,255,255,0.65)' }}
              >
                {count}
              </span>
            </div>
          );
        })}

        {/* Pending pill */}
        <div
          className="inline-flex items-center gap-3 h-[38px] rounded-full px-[15px] text-[13px] font-extrabold whitespace-nowrap"
          style={{ background: '#ede9fe', color: '#7c3aed' }}
        >
          {translations.pendingLabel || 'Pending'}
          <span
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px]"
            style={{ background: 'rgba(255,255,255,0.65)' }}
          >
            {pendingCount}
          </span>
        </div>
      </div>

      <p className="text-[14px] font-medium text-[#59687e] leading-[1.7] m-0">
        Role changes are audited with actor, correlationId and metadataSummary.
      </p>
    </div>
  );
}
