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

export function ApprovalPanel() {
  const approvals: ApprovalItemProps[] = [
    {
      icon: "U",
      iconColor: "orange",
      title: "Mai Phương",
      description: "Nâng role customer → specialist",
      badge: "Pending",
      badgeColor: "orange",
    },
    {
      icon: "W",
      iconColor: "blue",
      title: "Workspace mới",
      description: "Công ty Nam Việt",
      badge: "Review",
      badgeColor: "blue",
    },
    {
      icon: "A",
      iconColor: "red",
      title: "Audit exception",
      description: "Cần xác nhận truy cập bị từ chối",
      badge: "High",
      badgeColor: "red",
    },
  ];

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <CheckCircle width={22} height={22} />
          <span>Chờ phê duyệt</span>
        </div>
      </div>
      <div className="approval-list">
        {approvals.map((item, index) => (
          <ApprovalItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}
