'use client';

interface SummaryPanelProps {
  selectedService: string;
  workspaceName: string;
}

const SERVICE_NAMES: Record<string, string> = {
  'agent-contract': 'Soan hop dong dai ly',
  'labor-contract': 'Soan hop dong lao dong',
  'trademark': 'Dang ky nhan hieu',
  'nda': 'Ra soat hop dong / NDA',
  'other': 'Dich vu khac / chua ro loai viec',
};

function MiniIcon({ letter }: { letter: string }) {
  return (
    <div className="w-[34px] h-[34px] rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
      {letter}
    </div>
  );
}

export default function SummaryPanel({ selectedService, workspaceName }: SummaryPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-200">
        <div className="text-teal-700">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Tom tat ho so</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="space-y-4">
          {/* Selected Service */}
          <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Dich vu da chon</p>
              <p className="text-sm text-slate-600">{SERVICE_NAMES[selectedService] || 'Chua chon dich vu'}</p>
            </div>
            <MiniIcon letter="1" />
          </div>

          {/* Workspace */}
          <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Workspace</p>
              <p className="text-sm text-slate-600">{workspaceName} · an-phat</p>
            </div>
            <MiniIcon letter="W" />
          </div>

          {/* Processing Estimate */}
          <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Du kien xu ly</p>
              <p className="text-sm text-slate-600">2-3 ngay lam viec sau khi du tai lieu</p>
            </div>
            <MiniIcon letter="S" />
          </div>

          {/* Status */}
          <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Trang thai</p>
              <p className="text-sm text-slate-600">Ho so nap, chua gui cho chuyen vien</p>
            </div>
            <MiniIcon letter="D" />
          </div>
        </div>
      </div>
    </div>
  );
}
