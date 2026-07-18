'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';

interface IntakeAnswers {
  [key: string]: string;
}

export interface IntakeQuestionsFormHandle {
  getAnswers: () => IntakeAnswers;
  isValid: () => boolean;
}

interface IntakeQuestionsFormProps {
  selectedService: string;
  locale?: string;
}

interface Question {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'textarea';
}

const IntakeQuestionsForm = forwardRef<IntakeQuestionsFormHandle, IntakeQuestionsFormProps>(
  ({ selectedService, locale = 'vi' }, ref) => {
    const t = useTranslations('CreateRequest');
    const formRef = useRef<HTMLFormElement>(null);

    // Map selected service to matterTypeKey
    const matterTypeKey = selectedService === 'trademark' ? 'trademark_registration' : selectedService;

    // Get questions from catalog
    const matterType = SEED_MATTER_TYPES[matterTypeKey as keyof typeof SEED_MATTER_TYPES];
    const questions: Question[] = matterType?.questions ? [...matterType.questions] : [];

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getAnswers: () => {
        const form = formRef.current;
        if (!form) return {};

        const formData = new FormData(form);
        const answers: IntakeAnswers = {};

        for (const question of questions) {
          const value = formData.get(`answer.${question.key}`) as string;
          if (value?.trim()) {
            answers[question.key] = value.trim();
          }
        }

        return answers;
      },
      isValid: () => {
        const form = formRef.current;
        if (!form) return false;

        const formData = new FormData(form);
        for (const question of questions) {
          if (question.required) {
            const value = formData.get(`answer.${question.key}`) as string;
            if (!value?.trim()) {
              return false;
            }
          }
        }
        return true;
      },
    }));

    return (
      <form ref={formRef}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '18px' }}>
          {matterType?.description?.[locale as keyof typeof matterType.description] || matterType?.description?.vi || t('questions.fillInfo')}
        </p>

        {questions.map((question) => (
          <div key={question.key} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              {question.label[locale as keyof typeof question.label] || question.label.vi}
              {question.required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
            </label>
            {question.type === 'textarea' ? (
              <textarea
                name={`answer.${question.key}`}
                rows={4}
                placeholder={t('placeholder.enter', { field: (question.label[locale as keyof typeof question.label] || question.label.vi).toLowerCase() })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
              />
            ) : (
              <input
                type="text"
                name={`answer.${question.key}`}
                placeholder={t('placeholder.enter', { field: (question.label[locale as keyof typeof question.label] || question.label.vi).toLowerCase() })}
                className="h-11 w-full border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            )}
          </div>
        ))}

        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <span style={{ color: 'var(--color-danger)' }}>*</span> {t('label.requiredInfo')}
        </p>
      </form>
    );
  }
);

IntakeQuestionsForm.displayName = 'IntakeQuestionsForm';

export default IntakeQuestionsForm;
