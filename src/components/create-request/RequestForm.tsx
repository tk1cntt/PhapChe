'use client';

export default function RequestForm() {
  return (
    <div className="space-y-4">
      {/* Workspace & Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Workspace</label>
          <select className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none">
            <option>Cong ty An Phat</option>
            <option>Cong ty Minh Khang</option>
            <option>Workspace noi bo</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Muc do uu tien</label>
          <select className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none">
            <option>Thuong thuong</option>
            <option>Can xu ly som</option>
            <option>Khan cap</option>
          </select>
        </div>
      </div>

      {/* Contact Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Nguoi lien he</label>
          <input 
            type="text"
            defaultValue="Mai Phuong"
            className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Email lien he</label>
          <input 
            type="email"
            defaultValue="mai.phuong@anphat.vn"
            className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">Mo ta ngan yeu cau</label>
        <textarea 
          placeholder="Vi du: Can soan hop dong dai ly cho doi tac phan phoi khu vuc mien Bac, co chiet khau theo doanh so va thoi han 12 thang."
          className="h-24 w-full border border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
          rows={4}
        />
      </div>
    </div>
  );
}
