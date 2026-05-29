'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui';
import { generateDraftAction } from '../actions';
import type { TemplateVariable } from '@/lib/documents/template-service';

type Template = {
  id: string;
  label: string;
  version: number;
  description: string | null;
  variableSchema: TemplateVariable[];
};

type Props = {
  requestId: string;
  templates: Template[];
  initialAnswers: Record<string, unknown>;
};

function prefillVariables(schema: TemplateVariable[], answers: Record<string, unknown>): Record<string, string> {
  const filled: Record<string, string> = {};
  for (const variable of schema) {
    const value = answers[variable.key];
    filled[variable.key] = value != null ? String(value) : '';
  }
  return filled;
}

export default function GenerateDraftForm({ requestId, templates, initialAnswers }: Props) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId || null);
    setError(null);
    setSuccess(null);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setVariables(prefillVariables(template.variableSchema, initialAnswers));
      }
    } else {
      setVariables({});
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;

    setError(null);
    setSuccess(null);

    // Validate required variables
    const missing = selectedTemplate.variableSchema
      .filter((v) => v.required && (!variables[v.key] || variables[v.key].trim() === ''))
      .map((v) => v.label);

    if (missing.length > 0) {
      setError(`Vui lòng điền đầy đủ: ${missing.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await generateDraftAction({
        requestId,
        templateId: selectedTemplate.id,
        variables,
      });
      setSuccess('Đã tạo bản nháp thành công');
      setSelectedTemplateId(null);
      setVariables({});
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo bản nháp';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <select
        value={selectedTemplateId ?? ''}
        onChange={(e) => handleTemplateChange(e.target.value)}
        className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2 text-[16px] leading-[1.5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
      >
        <option value="">-- Chọn mẫu tài liệu --</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label} (v{t.version})
          </option>
        ))}
      </select>

      {selectedTemplate && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedTemplate.description && (
            <p className="text-[14px] leading-[1.4] text-[#475569]">{selectedTemplate.description}</p>
          )}

          {selectedTemplate.variableSchema.map((variable) => (
            <div key={variable.key}>
              <label className="text-[14px] font-semibold leading-[1.4] text-[#475569]">
                {variable.label}
                {variable.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                value={variables[variable.key] ?? ''}
                onChange={(e) => setVariables((v) => ({ ...v, [variable.key]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-4 py-2 text-[16px] leading-[1.5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>
          ))}

          {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-[14px] text-red-600">{error}</p>}
          {success && <p className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-[14px] text-[#0F766E]">{success}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang tạo...' : 'Tạo bản nháp'}
          </Button>
        </form>
      )}
    </div>
  );
}
