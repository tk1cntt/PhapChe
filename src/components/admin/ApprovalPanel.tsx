"use client";

import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ApprovalItemProps {
  icon: string;
  iconColor: "orange" | "blue" | "red";
  title: string;
  description: string;
  badge: string;
  badgeColor: "orange" | "blue" | "red";
}

const iconColorStyles = {
  orange: "bg-orange-100 text-orange-600",
  blue: "bg-blue-100 text-blue-600",
  red: "bg-red-100 text-red-600",
};

const badgeColorStyles = {
  orange: "bg-orange-100 text-orange-700",
  blue: "bg-blue-100 text-blue-700",
  red: "bg-red-100 text-red-700",
};

function ApprovalItem({ icon, iconColor, title, description, badge, badgeColor }: ApprovalItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${iconColorStyles[iconColor]}`}>
          {icon}
        </div>
        <div>
          <div className="font-semibold text-sm text-[#0f172a]">{title}</div>
          <div className="text-xs text-[#64748b]">{description}</div>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColorStyles[badgeColor]}`}>
        {badge}
      </span>
    </div>
  );
}

export function ApprovalPanel({ approvals = [] }: { approvals?: ApprovalItemProps[] }) {
  const t = useTranslations('AdminDashboard');

  return (
    <div
      className="bg-white border border-gray-200 rounded-[15px] shadow-md p-6"
      style={{ boxShadow: 'var(--soft-shadow)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 text-lg font-bold text-[#0f172a] mb-4">
        <CheckCircle width={22} height={22} className="text-teal-600" />
        <span>{t('approvalsPanel')}</span>
      </div>
      <div className="approval-list">
        {approvals.length === 0 ? (
          <div className="py-6 text-center text-[#94a3b8]">
            {t('noApprovals')}
          </div>
        ) : (
          approvals.map((item, index) => (
            <ApprovalItem key={index} {...item} />
          ))
        )}
      </div>
    </div>
  );
}

export default ApprovalPanel;
