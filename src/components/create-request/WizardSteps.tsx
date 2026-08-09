'use client';

import { Check, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWizard } from './WizardProvider';

interface WizardStepsProps {
  currentStep: 0 | 1 | 2 | 3 | 4 | 5;
  totalSteps?: number;
  completedSteps?: number[];
  validationErrors?: Record<number, boolean>;
}

export default function WizardSteps({
  currentStep,
  totalSteps = 6,
  completedSteps = [],
  validationErrors = {},
}: WizardStepsProps) {
  const t = useTranslations('CreateRequest');
  const { actions } = useWizard();

  const handleStepClick = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {
      actions.goToStep(stepNumber as 0 | 1 | 2 | 3 | 4 | 5);
    }
  };

  return (
    <div className="wizard-steps">
      {/* Steps row */}
      <div className="wizard-steps-row">
        {Array.from({ length: totalSteps }, (_, i) => i).map((stepNumber, index) => {
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const hasError = validationErrors[stepNumber];
          const isClickable = isCompleted;
          const label = t(`wizard.step${stepNumber}`);

          return (
            <div key={stepNumber} className="wizard-step-item">
              {/* Step */}
              <button
                type="button"
                onClick={() => handleStepClick(stepNumber)}
                disabled={!isClickable}
                className={`wizard-step-btn ${hasError ? 'error' : ''} ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isClickable && !isCurrent ? 'pending' : ''}`}
                title={t('wizard.stepTitle', { step: stepNumber, label })}
              >
                {hasError ? (
                  <AlertCircle size={16} />
                ) : isCompleted ? (
                  <Check size={16} />
                ) : (
                  <span className="step-num">{stepNumber}</span>
                )}
              </button>

              {/* Label */}
              <span className={`wizard-step-label ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}>
                {label}
              </span>

              {/* Connector line */}
              {index < totalSteps - 1 && (
                <div className={`wizard-step-connector ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
