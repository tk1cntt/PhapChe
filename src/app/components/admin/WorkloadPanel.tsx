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

export function WorkloadPanel() {
  const specialists: WorkloadItemProps[] = [
    { initials: "HL", name: "Hà Linh", role: "Specialist", progress: 84, status: "ok", count: "16 hồ sơ" },
    { initials: "QD", name: "Quang Dũng", role: "Reviewer", progress: 68, status: "ok", count: "12 hồ sơ" },
    { initials: "MT", name: "Minh Trang", role: "Coordinator Admin", progress: 52, status: "ok", count: "8 hồ sơ" },
    { initials: "KA", name: "Khánh An", role: "Audit Admin", progress: 74, status: "warn", count: "11 hồ sơ" },
  ];

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
        {specialists.map((spec) => (
          <WorkloadItem key={spec.initials} {...spec} />
        ))}
      </div>
    </div>
  );
}
