'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export type TemplateVariable = {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'select';
};

export function VariableSchemaBuilder() {
  const t = useTranslations('AdminTemplates');
  const [rows, setRows] = useState<TemplateVariable[]>([]);

  const TYPE_OPTIONS: { value: TemplateVariable['type']; label: string }[] = [
    { value: 'text', label: t('textType') },
    { value: 'number', label: t('numberType') },
    { value: 'date', label: t('dateType') },
    { value: 'select', label: t('selectType') },
  ];

  function addRow() {
    setRows((prev) => [...prev, { key: '', label: '', required: false, type: 'text' }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof TemplateVariable, value: string | boolean) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="variableSchema" value={JSON.stringify(rows)} />

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-left">
                <th className="pb-2 pr-3 font-semibold text-[#0F172A]">{t('key')}</th>
                <th className="pb-2 pr-3 font-semibold text-[#0F172A]">{t('label')}</th>
                <th className="pb-2 pr-3 font-semibold text-[#0F172A]">{t('required')}</th>
                <th className="pb-2 pr-3 font-semibold text-[#0F172A]">{t('type')}</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#F1F5F9]">
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={row.key}
                      onChange={(e) => updateRow(i, 'key', e.target.value)}
                      placeholder="company_name"
                      className="w-full rounded-lg border border-[#CBD5E1] px-2 py-1.5 text-[13px] focus:border-[#0F766E] focus:outline-none"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(i, 'label', e.target.value)}
                      placeholder={t('companyName')}
                      className="w-full rounded-lg border border-[#CBD5E1] px-2 py-1.5 text-[13px] focus:border-[#0F766E] focus:outline-none"
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={row.required}
                      onChange={(e) => updateRow(i, 'required', e.target.checked)}
                      className="h-4 w-4 rounded border-[#CBD5E1]"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={row.type}
                      onChange={(e) => updateRow(i, 'type', e.target.value)}
                      className="w-full rounded-lg border border-[#CBD5E1] px-2 py-1.5 text-[13px] focus:border-[#0F766E] focus:outline-none"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="rounded p-1 text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="rounded-xl border border-dashed border-[#CBD5E1] px-4 py-2 text-[14px] font-medium text-[#475569] hover:border-[#0F766E] hover:text-[#0F766E]"
      >
        {t('addVariable')}
      </button>
    </div>
  );
}
