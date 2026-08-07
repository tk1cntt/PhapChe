'use client';

import { Check, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWizard } from './WizardProvider';

interface WizardStepsProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  totalSteps?: number;
  completedSteps?: number[];
  validationErrors?: Record<number, boolean>;
}

export default function WizardSteps({
  currentStep,
  totalSteps = 5,
  completedSteps = [],
  validationErrors = {},
}: WizardStepsProps) {
  const t = useTranslations('CreateRequest');
  const { actions } = useWizard();

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber < 1 || stepNumber > totalSteps) return;
    if (completedSteps.includes(stepNumber)) {
      actions.goToStep(stepNumber as 1 | 2 | 3 | 4 | 5);
    }
  };
  };
  return (
    <div className="wizard-steps">
      {/* Steps row */}
      <div className="wizard-steps-row">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber, index) => {
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const hasError = validationErrors[stepNumber];
          const label = t(`wizard.step${stepNumber}`);

          return (
            <div key={stepNumber} className="wizard-step-item">
              {/* Step */}
              <button
                type="button"
                onClick={() => handleStepClick(stepNumber)}
                disabled={!isClickable}
function getStepBtnClassName(
  hasError: boolean,
  isCompleted: boolean,
  isCurrent: boolean,
  isClickable: boolean,
): string {
  const classes = ['wizard-step-btn'];
  if (hasError) classes.push('error');
  if (isCompleted) classes.push('completed');
  if (isCurrent) classes.push('current');
  if (!isClickable && !isCurrent) classes.push('pending');
  return classes.join(' ');
}
  hasError: boolean,
  isCompleted: boolean,
  isCurrent: boolean,
  isClickable: boolean,
): string {
  const classes = ['wizard-step-btn'];
  if (hasError) classes.push('error');
  if (isCompleted) classes.push('completed');
  if (isCurrent) classes.push('current');
  if (!isClickable && !isCurrent) classes.push('pending');
  return classes.join(' ');
}
}
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
