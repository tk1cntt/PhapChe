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

const iconColorStyles = {
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  orange: "bg-orange-100 text-orange-600",
};

const badgeColorStyles = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
};

function WorkspaceItem({ initials, iconColor, name, description, badge, badgeColor }: WorkspaceItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${iconColorStyles[iconColor]}`}>
          {initials}
        </div>
        <div>
          <div className="font-semibold text-sm text-[#0f172a]">{name}</div>
          <div className="text-xs text-[#64748b]">{description}</div>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColorStyles[badgeColor]}`}>
        {badge}
      </span>
    </div>
  );
}

export function WorkspacePanel({ workspaces = [] }: { workspaces?: WorkspaceItemProps[] }) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-[15px] shadow-md p-6"
      style={{ boxShadow: 'var(--soft-shadow)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 text-lg font-bold text-[#0f172a] mb-4">
        <Building width={22} height={22} className="text-teal-600" />
        <span>Workspace nổi bật</span>
      </div>
      <div className="workspace-list">
        {workspaces.length === 0 ? (
          <div className="py-6 text-center text-[#94a3b8]">
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
