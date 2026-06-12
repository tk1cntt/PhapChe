'use client';

import { useRef } from 'react';
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';

interface IntakeAnswers {
  [key: string]: string;
}

interface IntakeQuestionsFormProps {
  selectedService: string;
  onAnswersChange: (answers: IntakeAnswers) => void;
  onValidChange: (isValid: boolean) => void;
  locale?: string;
}

interface Question {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'textarea';
}

export default function IntakeQuestionsForm({ selectedService, onAnswersChange, onValidChange, locale = 'vi' }: IntakeQuestionsFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // Map selected service to matterTypeKey
  const matterTypeKey = selectedService === 'trademark' ? 'trademark_registration' : selectedService;

  // Get questions from catalog
  const matterType = SEED_MATTER_TYPES[matterTypeKey as keyof typeof SEED_MATTER_TYPES];
  const questions: Question[] = matterType?.questions || [];

  const handleChange = () => {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const answers: IntakeAnswers = {};
    let isValid = true;

    for (const question of questions) {
      const value = formData.get(`answer.${question.key}`) as string;
      if (value?.trim()) {
        answers[question.key] = value.trim();
      }

      if (question.required && !value?.trim()) {
        isValid = false;
      }
    }

    onAnswersChange(answers);
    onValidChange(isValid);
  };

  return (
    <form ref={formRef} onChange={handleChange}>
      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '18px' }}>
        {matterType?.description?.[locale as keyof typeof matterType.description] || matterType?.description?.vi || 'Điền thông tin cần thiết'}
      </p>

      {questions.map((question) => (
        <div key={question.key} style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            {question.label}
            {question.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
          </label>
          {question.type === 'textarea' ? (
            <textarea
              name={`answer.${question.key}`}
              rows={4}
              placeholder={`Nhập ${question.label.toLowerCase()}...`}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
            />
          ) : (
            <input
              type="text"
              name={`answer.${question.key}`}
              placeholder={`Nhập ${question.label.toLowerCase()}...`}
              className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
            />
          )}
        </div>
      ))}

      <p style={{ fontSize: '12px', color: '#64748b' }}>
        <span style={{ color: '#ef4444' }}>*</span> Thông tin bắt buộc
      </p>
    </form>
  );
}
