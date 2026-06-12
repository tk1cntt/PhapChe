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

const defaultSteps = {
  vi: 'Dịch vụ',
  en: 'Service',
  zh: '服务',
  ja: 'サービス',
};

export default function WizardSteps({ currentStep, steps, locale = 'vi' }: WizardStepsProps) {
  const stepLabels = steps || translations[locale as keyof typeof translations] || translations.vi;
  
  return (
    <div className="flex items-center gap-3">
      {stepLabels.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={step} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                  ${isActive ? 'bg-emerald-500 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-slate-500'}`}
              >
                {isCompleted ? <Check size={14} /> : stepNumber}
              </div>
              <span className="text-sm font-semibold whitespace-nowrap">{step}</span>
            </div>
            {index < stepLabels.length - 1 && (
              <div className="h-0.5 flex-1 bg-slate-200 rounded-full" />
            )}
          </div>
        );
      })}
    </div>
  );
}
