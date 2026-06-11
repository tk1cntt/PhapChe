"use client";

import { AlertTriangle } from "lucide-react";

interface AlertItemProps {
  icon: string;
  iconColor: "red" | "orange" | "blue" | "green";
  title: string;
  description: string;
  badge: string;
  badgeColor: "red" | "orange" | "blue" | "green";
}

function AlertItem({ icon, iconColor, title, description, badge, badgeColor }: AlertItemProps) {
  return (
    <div className="alert-item">
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

export function AlertPanel() {
  const alerts: AlertItemProps[] = [
    {
      icon: "!",
      iconColor: "red",
      title: "Truy cập bị từ chối",
      description: "Reviewer ngoài workspace scope",
      badge: "Audit",
      badgeColor: "red",
    },
    {
      icon: "S",
      iconColor: "orange",
      title: "6 hồ sơ sắp quá SLA",
      description: "Cần điều phối trước 17:00",
      badge: "SLA",
      badgeColor: "orange",
    },
    {
      icon: "R",
      iconColor: "blue",
      title: "2 yêu cầu đổi role",
      description: "Đang chờ Super Admin duyệt",
      badge: "Role",
      badgeColor: "blue",
    },
    {
      icon: "V",
      iconColor: "green",
      title: "Vault scan hoàn tất",
      description: "96% tệp có workspace scope",
      badge: "Vault",
      badgeColor: "green",
    },
  ];

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <AlertTriangle width={22} height={22} />
          <span>Cảnh báo cần xử lý</span>
        </div>
      </div>
      <div className="alert-list">
        {alerts.map((alert, index) => (
          <AlertItem key={index} {...alert} />
        ))}
      </div>
    </div>
  );
}
