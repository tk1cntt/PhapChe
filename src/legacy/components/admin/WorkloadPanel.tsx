"use client";

import { BarChart2 } from "lucide-react";

interface WorkloadItemProps {
  initials: string;
  name: string;
  role: string;
  progress: number;
  status: "ok" | "warn" | "danger";
  count: string;
}

function WorkloadItem({ initials, name, role, progress, status, count }: WorkloadItemProps) {
  const progressClass = status === "ok" ? "" : status === "warn" ? "warn" : "danger";

  return (
    <div className="workload-item">
      <div className="person">
        <div className="person-avatar">{initials}</div>
        <div>
          <strong>{name}</strong>
          <span>{role}</span>
        </div>
      </div>
      <div className="progress">
        <span className={progressClass} style={{ width: `${progress}%` }} />
      </div>
      <div className="workload-count">{count}</div>
    </div>
  );
}

export function WorkloadPanel({ specialists = [] }: { specialists?: WorkloadItemProps[] }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <BarChart2 width={22} height={22} />
          <span>Workload chuyên viên</span>
        </div>
        <a className="small-link" href="#">
          Xem chi tiết →
        </a>
      </div>
      <div className="workload-list">
        {specialists.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
            Chưa có dữ liệu workload
          </div>
        ) : (
          specialists.map((spec) => (
            <WorkloadItem key={spec.initials} {...spec} />
          ))
        )}
      </div>
    </div>
  );
}

export default WorkloadPanel;
