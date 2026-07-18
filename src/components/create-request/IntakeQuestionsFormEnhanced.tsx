'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { SEED_MATTER_TYPES, getMatterQuestions, type QuestionDefinition } from '@/lib/i18n/seed-legal-domains';

interface IntakeQuestionsFormEnhancedProps {
  serviceType: string;
  answers: Record<string, string>;
  onAnswerChange: (key: string, value: string) => void;
  errors: Record<string, string>;
  locale?: string;
}

/**
 * Validate a single field value
 */
function validateField(question: QuestionDefinition, value: string): { required?: string; invalidEmail?: string; invalidPhone?: string } {
  if (question.required && !value.trim()) {
    return { required: 'required' };
  }

  if (question.key.includes('email') && value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return { invalidEmail: 'invalidEmail' };
    }
  }

  if (question.key.includes('phone') && value.trim()) {
    const phoneRegex = /^(\+?84|0)\d{9,10}$/;
    if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
      return { invalidPhone: 'invalidPhone' };
    }
  }

  return {};
}

/**
 * Validate all required questions — returns error keys for i18n lookup
 */
export function validateQuestionsForm(
  serviceType: string,
  answers: Record<string, string>
): Record<string, string> {
  const questions = getMatterQuestions(serviceType);
  const errors: Record<string, string> = {};

  for (const question of questions) {
    const result = validateField(question, answers[question.key] || '');
    const keys = Object.values(result).filter(Boolean);
    if (keys.length > 0) {
      errors[question.key] = keys[0];
    }
  }

  return errors;
}

/**
 * Resolve error key to i18n message
 */
function resolveError(key: string, t: ReturnType<typeof useTranslations<'CreateRequest'>>): string {
  const map: Record<string, string> = {
    required: t('error.required'),
    invalidEmail: t('error.invalidEmail'),
    invalidPhone: t('error.invalidPhone'),
  };
  return map[key] || key;
}

/**
 * Enhanced intake questions form with controlled inputs, validation, and error display
 */
export default function IntakeQuestionsFormEnhanced({
  serviceType,
  answers,
  onAnswerChange,
  errors,
  locale = 'vi',
}: IntakeQuestionsFormEnhancedProps) {
  const t = useTranslations('CreateRequest');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const questions = getMatterQuestions(serviceType);
  const serviceTypeInfo = SEED_MATTER_TYPES[serviceType];
  const description = serviceTypeInfo?.description;
  const descText = description
    ? description[locale as keyof typeof description] || description.vi
    : t('questions.fillInfo');

  const handleBlur = useCallback(
    (question: QuestionDefinition) => {
      setTouched((prev) => ({ ...prev, [question.key]: true }));
      const value = answers[question.key] || '';
      const result = validateField(question, value);
      if (touched[question.key] && Object.keys(result).length > 0) {
        onAnswerChange(question.key, value);
      }
    },
    [answers, touched, onAnswerChange]
  );

  if (questions.length === 0) {
    return (
      <p className="placeholder-content">
        {t('questions.noQuestions')}
      </p>
    );
  }

  return (
    <div className="w-full">
      <h2 className="step-title">{t('questions.title')}</h2>
      <p className="step-desc">{descText}</p>

      <div className="questions-list">
        {questions.map((question, index) => {
          const value = answers[question.key] || '';
          const errorKey = touched[question.key] ? errors[question.key] : undefined;
          const hasError = !!errorKey;
          const fieldPlaceholder = t('placeholder.enter', { field: question.label.toLowerCase() });

          return (
            <div key={question.key} className="question-field">
              <label htmlFor={`q-${question.key}`} className="question-label">
                {t('questions.questionNumber', { n: index + 1 })}: {question.label}
                {question.required && <span className="required-star">*</span>}
              </label>

              {question.type === 'textarea' ? (
                <textarea
                  id={`q-${question.key}`}
                  rows={4}
                  value={value}
                  onChange={(e) => onAnswerChange(question.key, e.target.value)}
                  onBlur={() => handleBlur(question)}
                  placeholder={fieldPlaceholder}
                  className={`question-textarea ${hasError ? 'has-error' : ''}`}
                />
              ) : (
                <input
                  id={`q-${question.key}`}
                  type={question.key.includes('email') ? 'email' : question.key.includes('phone') ? 'tel' : 'text'}
                  value={value}
                  onChange={(e) => onAnswerChange(question.key, e.target.value)}
                  onBlur={() => handleBlur(question)}
                  placeholder={fieldPlaceholder}
                  className={`question-input ${hasError ? 'has-error' : ''}`}
                />
              )}

              {hasError && (
                <div className="field-error">
                  <AlertCircle size={14} />
                  <span>{resolveError(errorKey, t)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="required-note">
        <span className="required-star">*</span> {t('label.requiredInfo')}
      </p>
    </div>
  );
}
