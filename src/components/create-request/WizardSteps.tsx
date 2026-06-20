'use client';

import { Check, AlertCircle } from 'lucide-react';
import { useWizard } from './WizardProvider';

interface WizardStepsProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  totalSteps?: number;
  completedSteps?: number[];
  validationErrors?: Record<number, boolean>;
}

const STEP_LABELS = [
  'Lĩnh vực',
  'Dịch vụ',
  'Thông tin',
  'Tài liệu',
  'Xác nhận',
];

export default function WizardSteps({
  currentStep,
  totalSteps = 5,
  completedSteps = [],
  validationErrors = {},
}: WizardStepsProps) {
  const { actions } = useWizard();

  const handleStepClick = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {
      actions.goToStep(stepNumber as 1 | 2 | 3 | 4 | 5);
    }
  };

  return (
    <div className="wizard-steps">
      {/* Steps row */}
      <div className="wizard-steps-row">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber, index) => {
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const hasError = validationErrors[stepNumber];
          const isClickable = isCompleted;

          return (
            <div key={stepNumber} className="wizard-step-item">
              {/* Step */}
              <button
                type="button"
                onClick={() => handleStepClick(stepNumber)}
                disabled={!isClickable}
                className={`wizard-step-btn ${hasError ? 'error' : ''} ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isClickable && !isCurrent ? 'pending' : ''}`}
                title={`Bước ${stepNumber}: ${STEP_LABELS[stepNumber - 1]}`}
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
                {STEP_LABELS[stepNumber - 1]}
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
