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

export function WorkspacePanel({ workspaces = [] }: { workspaces?: WorkspaceItemProps[] }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <Building width={22} height={22} />
          <span>Workspace nổi bật</span>
        </div>
      </div>
      <div className="workspace-list">
        {workspaces.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
            Chưa có workspace nào
          </div>
        ) : (
          workspaces.map((ws, index) => (
            <WorkspaceItem key={index} {...ws} />
          ))
        )}
      </div>
    </div>
  );
}

export default WorkspacePanel;
