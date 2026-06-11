"use client";

import { Building } from "lucide-react";

interface WorkspaceItemProps {
  initials: string;
  iconColor: "green" | "blue" | "orange";
  name: string;
  description: string;
  badge: string;
  badgeColor: "green" | "blue";
}

function WorkspaceItem({ initials, iconColor, name, description, badge, badgeColor }: WorkspaceItemProps) {
  return (
    <div className="workspace-item">
      <div className="item-left">
        <div className={`item-icon ${iconColor}`}>{initials}</div>
        <div className="item-info">
          <strong>{name}</strong>
          <span>{description}</span>
        </div>
      </div>
      <span className={`badge ${badgeColor}`}>{badge}</span>
    </div>
  );
}

export function WorkspacePanel() {
  const workspaces: WorkspaceItemProps[] = [
    {
      initials: "AP",
      iconColor: "green",
      name: "Công ty An Phát",
      description: "34 users · 18 hồ sơ",
      badge: "Active",
      badgeColor: "green",
    },
    {
      initials: "MK",
      iconColor: "blue",
      name: "Công ty Minh Khang",
      description: "22 users · 13 hồ sơ",
      badge: "Active",
      badgeColor: "green",
    },
    {
      initials: "IN",
      iconColor: "orange",
      name: "Workspace nội bộ",
      description: "41 users · audit enabled",
      badge: "Internal",
      badgeColor: "blue",
    },
  ];

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <Building width={22} height={22} />
          <span>Workspace nổi bật</span>
        </div>
      </div>
      <div className="workspace-list">
        {workspaces.map((ws, index) => (
          <WorkspaceItem key={index} {...ws} />
        ))}
      </div>
    </div>
  );
}
