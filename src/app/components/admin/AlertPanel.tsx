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

export function AlertPanel({ alerts = [] }: { alerts?: AlertItemProps[] }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <AlertTriangle width={22} height={22} />
          <span>Cảnh báo cần xử lý</span>
        </div>
      </div>
      <div className="alert-list">
        {alerts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
            Không có cảnh báo
          </div>
        ) : (
          alerts.map((alert, index) => (
            <AlertItem key={index} {...alert} />
          ))
        )}
      </div>
    </div>
  );
}

export default AlertPanel;
