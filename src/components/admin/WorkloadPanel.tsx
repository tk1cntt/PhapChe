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
  const progressColorClass = status === "ok"
    ? "bg-teal-500"
    : status === "warn"
    ? "bg-orange-500"
    : "bg-red-500";

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[#0f172a] text-sm truncate">{name}</div>
          <div className="text-xs text-[#64748b]">{role}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColorClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm font-semibold text-[#64748b] w-16 text-right shrink-0">{count}</div>
      </div>
    </div>
  );
}

export function WorkloadPanel({ specialists = [] }: { specialists?: WorkloadItemProps[] }) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-[15px] shadow-md p-6"
      style={{ boxShadow: 'var(--soft-shadow)', borderColor: 'var(--border)' }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3 text-lg font-bold text-[#0f172a]">
          <BarChart2 width={22} height={22} className="text-teal-600" />
          <span>Workload chuyên viên</span>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-teal-600 hover:text-teal-700 bg-transparent border-0 cursor-pointer"
        >
          Xem chi tiết →
        </button>
      </div>
      <div className="workload-list">
        {specialists.length === 0 ? (
          <div className="py-6 text-center text-[#94a3b8]">
            Chưa có dữ liệu workload
          </div>
        ) : (
          specialists.map((spec, index) => (
            <WorkloadItem key={index} {...spec} />
          ))
        )}
      </div>
    </div>
  );
}

export default WorkloadPanel;
