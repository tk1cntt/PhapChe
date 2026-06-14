'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

interface WizardStepsProps {
  currentStep: number;
  steps?: string[];
  locale?: string;
}

export default function WizardSteps({ currentStep, steps, locale = 'vi' }: WizardStepsProps) {
  const t = useTranslations('Intake');

  const defaultSteps = [
    t('stepService'),
    t('stepQuestions'),
    t('stepDocuments'),
    t('stepReview'),
  ];

  const stepLabels = steps || defaultSteps;

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
