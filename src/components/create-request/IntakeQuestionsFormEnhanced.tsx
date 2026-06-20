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
      // We don't directly set errors here - the parent component manages errors
      // But we trigger re-validation through the onAnswerChange with same value
      if (touched[question.key]) {
        onAnswerChange(question.key, value);
      }
    },
    [answers, touched, onAnswerChange]
  );

  if (questions.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Không có câu hỏi cho dịch vụ này.
      </p>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông tin chi tiết</h2>
      <p className="text-sm text-gray-600 mb-6">{descText}</p>

      <div className="space-y-5">
        {questions.map((question, index) => {
          const value = answers[question.key] || '';
          const error = touched[question.key] ? errors[question.key] : undefined;
          const hasError = !!error;

          return (
            <div key={question.key}>
              <label
                htmlFor={`q-${question.key}`}
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Câu hỏi {index + 1}: {question.label}
                {question.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {question.type === 'textarea' ? (
                <textarea
                  id={`q-${question.key}`}
                  rows={4}
                  value={value}
                  onChange={(e) => onAnswerChange(question.key, e.target.value)}
                  onBlur={() => handleBlur(question)}
                  placeholder={`Nhập ${question.label.toLowerCase()}...`}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:ring-2 outline-none resize-y ${
                    hasError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
              ) : (
                <input
                  id={`q-${question.key}`}
                  type={question.key.includes('email') ? 'email' : question.key.includes('phone') ? 'tel' : 'text'}
                  value={value}
                  onChange={(e) => onAnswerChange(question.key, e.target.value)}
                  onBlur={() => handleBlur(question)}
                  placeholder={`Nhập ${question.label.toLowerCase()}...`}
                  className={`h-11 w-full border rounded-lg px-3 text-sm text-gray-700 focus:ring-2 outline-none ${
                    hasError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
              )}

              {hasError && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle size={14} className="text-red-500" />
                  <span className="text-sm text-red-500">{error}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        <span className="text-red-500">*</span> Thông tin bắt buộc
      </p>
    </div>
  );
}
