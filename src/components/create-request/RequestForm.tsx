'use client';

import { useTranslations } from 'next-intl';

// TODO: workspace options should be fetched from DB per tenant
const WORKSPACE_OPTIONS = ['Công ty An Phát', 'Công ty Minh Khang', 'Workspace nội bộ'];

export default function RequestForm() {
  const t = useTranslations('UserCreateRequest');

  return (
    <div className="space-y-4">
      {/* Workspace & Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">{t('workspace')}</label>
          <select className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none">
            {WORKSPACE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">{t('priority')}</label>
          <select className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none">
            <option value="normal">{t('priorityNormal')}</option>
            <option value="urgent">{t('priorityUrgent')}</option>
            <option value="critical">{t('priorityCritical')}</option>
          </select>
        </div>
      </div>

      {/* Contact Info Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">{t('contact')}</label>
          <input
            type="text"
            placeholder={t('contactPlaceholder')}
            className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">{t('contactEmail')}</label>
          <input
            type="email"
            placeholder="name@company.com"
            className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
        </div>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">{t('description')}</label>
        <textarea
          placeholder={t('descriptionPlaceholder')}
          rows={4}
          className="w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
        />
      </div>
    </div>
  );
}
