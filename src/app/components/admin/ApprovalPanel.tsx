"use client";

import { CheckCircle } from "lucide-react";

interface ApprovalItemProps {
  icon: string;
  iconColor: "orange" | "blue" | "red";
  title: string;
  description: string;
  badge: string;
  badgeColor: "orange" | "blue" | "red";
}

function ApprovalItem({ icon, iconColor, title, description, badge, badgeColor }: ApprovalItemProps) {
  return (
    <div className="approval-item">
      <div className="item-left">
        <div className={`item-icon ${iconColor}`}>{icon}</div>
        <div className="item-info">
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
      </div>
      <span className={`badge ${badgeColor}`}>{badge}</span>
    </div>
  );
}

export function ApprovalPanel({ approvals = [] }: { approvals?: ApprovalItemProps[] }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <CheckCircle width={22} height={22} />
          <span>Chờ phê duyệt</span>
        </div>
      </div>
      <div className="approval-list">
        {approvals.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
            Không có yêu cầu chờ duyệt
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
