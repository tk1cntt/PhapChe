'use client';

import { Check } from 'lucide-react';

const CHECKLIST_ITEMS = [
  {
    title: 'Thong tin doi tac',
    description: 'Ten phap ly, ma so thue, dia chi, nguoi dai dien.',
  },
  {
    title: 'Dieu khoan thuong mai',
    description: 'Chiet khau, hoa hong, doanh so, ky thanh toan.',
  },
  {
    title: 'Pham vi dai ly',
    description: 'Khu vuc, san pham, quyen doc quyen hoac khong doc quyen.',
  },
  {
    title: 'Tai lieu lien quan',
    description: 'Bao gia, mau hop dong cu, chinh sach ban hang neu co.',
  },
];

export default function ChecklistPanel() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-200">
        <div className="text-teal-700">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Checklist can chuan bi</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="space-y-4">
          {CHECKLIST_ITEMS.map((item) => (
            <div key={item.title} className="flex gap-3 items-start">
              {/* Check icon */}
              <div className="w-[22px] h-[22px] rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                <Check size={13} />
              </div>
              
              {/* Text */}
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
