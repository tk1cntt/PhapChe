'use client';

interface RequestFormProps {
  locale?: string;
}

const TRANSLATIONS = {
  vi: {
    workspace: 'Workspace',
    workspaceOptions: ['Công ty An Phat', 'Cong ty Minh Khang', 'Workspace noi bo'],
    priority: 'Muc do uu tien',
    priorityOptions: ['Thuong thuong', 'Can xu ly som', 'Khan cap'],
    contact: 'Nguoi lien he',
    contactEmail: 'Email lien he',
    description: 'Mo ta ngan yeu cau',
    descriptionPlaceholder: 'Vi du: Can soan hop dong dai ly cho doi tac phan phoi khu vuc mien Bac, co chiet khau theo doanh so va thoi han 12 thang.',
  },
  en: {
    workspace: 'Workspace',
    workspaceOptions: ['An Phat Corp', 'Minh Khang Corp', 'Internal Workspace'],
    priority: 'Priority',
    priorityOptions: ['Normal', 'Urgent', 'Critical'],
    contact: 'Contact name',
    contactEmail: 'Contact email',
    description: 'Brief description',
    descriptionPlaceholder: 'Example: Draft agency contract for Northern region partner with volume-based discounts and 12-month term.',
  },
  zh: {
    workspace: 'Workspace',
    workspaceOptions: ['An Phat 公司', 'Minh Khang 公司', '内部Workspace'],
    priority: '优先级',
    priorityOptions: ['常规', '加急', '紧急'],
    contact: '联系人',
    contactEmail: '联系方式',
    description: '简要描述',
    descriptionPlaceholder: '示例：北部地区代理合同，月销量折扣，12个月期限。',
  },
  ja: {
    workspace: 'Workspace',
    workspaceOptions: ['An Phat社', 'Minh Khang社', '内部Workspace'],
    priority: '優先度',
    priorityOptions: ['通常', '至急', '緊急'],
    contact: '担当者名',
    contactEmail: 'メールアドレス',
    description: '概要',
    descriptionPlaceholder: '例：北部代理店契約、月商’Abc’に基づく ‘割引、12ヶ月契約。Abc’Abc。’Abc’Abc。’Abc’Abc。’,
  },
};

export default function RequestForm({ locale = 'vi' }: RequestFormProps) {
  const t = TRANSLATIONS[locale as keyof typeof TRANSLATIONS] || TRANSLATIONS.vi;

  return (
    <div className="space-y-4">
      {/* Workspace & Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">{t.workspace}</label>
          <select className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none">
            {t.workspaceOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">{t.priority}</label>
          <select className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none">
            {t.priorityOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">{t.contact}</label>
          <input
            type="text"
            defaultValue="Mai Phuong"
            className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">{t.contactEmail}</label>
          <input
            type="email"
            defaultValue="mai.phuong@anphat.vn"
            className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">{t.description}</label>
        <textarea
          placeholder={t.descriptionPlaceholder}
          className="h-24 w-full border border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
          rows={4}
        />
      </div>
    </div>
  );
}
