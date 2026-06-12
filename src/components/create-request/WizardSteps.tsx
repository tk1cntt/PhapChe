'use client';

import { Check } from 'lucide-react';

interface WizardStepsProps {
  currentStep: number;
  steps?: string[];
  locale?: string;
}

const translations = {
  vi: ['Dịch vụ', 'Câu hỏi', 'Tài liệu', 'Kiểm tra'],
  en: ['Service', 'Questions', 'Documents', 'Review'],
  zh: ['服务', '问题', '文件', '审核'],
  ja: ['サービス', '質問', '書類', '確認'],
};

export default function WizardSteps({ currentStep, steps, locale = 'vi' }: WizardStepsProps) {
  const stepLabels = steps || translations[locale as keyof typeof translations] || translations.vi;

  return (
    <div className="steps">
      {stepLabels.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={step} className="step-fragment">
            <div className={`step ${isActive || isCompleted ? 'active' : ''}`}>
              <div className="step-number">
                {isCompleted ? <Check size={14} /> : stepNumber}
              </div>
              <span>{step}</span>
            </div>
            {index < stepLabels.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}
