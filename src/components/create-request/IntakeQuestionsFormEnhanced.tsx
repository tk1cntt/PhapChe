'use client';

import { useState, useCallback } from 'react';
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
function validateField(question: QuestionDefinition, value: string): string {
  if (question.required && !value.trim()) {
    return 'Trường này là bắt buộc';
  }

  // Email validation
  if (question.key.includes('email') && value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Email không hợp lệ';
    }
  }

  // Phone validation (VN format)
  if (question.key.includes('phone') && value.trim()) {
    const phoneRegex = /^(\+?84|0)\d{9,10}$/;
    if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
      return 'Số điện thoại không hợp lệ';
    }
  }

  return '';
}

/**
 * Validate all required questions
 */
export function validateQuestionsForm(
  serviceType: string,
  answers: Record<string, string>
): Record<string, string> {
  const questions = getMatterQuestions(serviceType);
  const errors: Record<string, string> = {};

  for (const question of questions) {
    const error = validateField(question, answers[question.key] || '');
    if (error) {
      errors[question.key] = error;
    }
  }

  return errors;
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const questions = getMatterQuestions(serviceType);
  const serviceTypeInfo = SEED_MATTER_TYPES[serviceType];
  const description = serviceTypeInfo?.description;
  const descText = description
    ? description[locale as keyof typeof description] || description.vi
    : 'Điền thông tin cần thiết';

  const handleBlur = useCallback(
    (question: QuestionDefinition) => {
      setTouched((prev) => ({ ...prev, [question.key]: true }));
      const value = answers[question.key] || '';
      const error = validateField(question, value);
      if (touched[question.key]) {
        onAnswerChange(question.key, value);
      }
    },
    [answers, touched, onAnswerChange]
  );

  if (questions.length === 0) {
    return (
      <p className="placeholder-content">
        Không có câu hỏi cho dịch vụ này.
      </p>
    );
  }

  return (
    <div className="w-full">
      <h2 className="step-title">Thông tin chi tiết</h2>
      <p className="step-desc">{descText}</p>

      <div className="questions-list">
        {questions.map((question, index) => {
          const value = answers[question.key] || '';
          const error = touched[question.key] ? errors[question.key] : undefined;
          const hasError = !!error;

          return (
            <div key={question.key} className="question-field">
              <label htmlFor={`q-${question.key}`} className="question-label">
                Câu hỏi {index + 1}: {question.label}
                {question.required && <span className="required-star">*</span>}
              </label>

              {question.type === 'textarea' ? (
                <textarea
                  id={`q-${question.key}`}
                  rows={4}
                  value={value}
                  onChange={(e) => onAnswerChange(question.key, e.target.value)}
                  onBlur={() => handleBlur(question)}
                  placeholder={`Nhập ${question.label.toLowerCase()}...`}
                  className={`question-textarea ${hasError ? 'has-error' : ''}`}
                />
              ) : (
                <input
                  id={`q-${question.key}`}
                  type={question.key.includes('email') ? 'email' : question.key.includes('phone') ? 'tel' : 'text'}
                  value={value}
                  onChange={(e) => onAnswerChange(question.key, e.target.value)}
                  onBlur={() => handleBlur(question)}
                  placeholder={`Nhập ${question.label.toLowerCase()}...`}
                  className={`question-input ${hasError ? 'has-error' : ''}`}
                />
              )}

              {hasError && (
                <div className="field-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="required-note">
        <span className="required-star">*</span> Thông tin bắt buộc
      </p>
    </div>
  );
}
