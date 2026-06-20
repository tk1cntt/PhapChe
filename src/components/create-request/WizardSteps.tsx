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
    // Only allow clicking completed steps
    if (completedSteps.includes(stepNumber)) {
      actions.goToStep(stepNumber as 1 | 2 | 3 | 4 | 5);
    }
  };

  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full mb-6">
        <div
          className="absolute h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => {
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const hasError = validationErrors[stepNumber];
          const isClickable = isCompleted;

          let bgColor = 'bg-gray-200';
          let textColor = 'text-gray-500';
          let cursor = 'cursor-not-allowed';

          if (hasError) {
            bgColor = 'bg-red-500';
            textColor = 'text-white';
          } else if (isCompleted) {
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            cursor = 'cursor-pointer';
          } else if (isCurrent) {
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
          }

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => handleStepClick(stepNumber)}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${bgColor} ${textColor} ${cursor} hover:scale-105 disabled:hover:scale-100`}
                title={`Bước ${stepNumber}: ${STEP_LABELS[stepNumber - 1]}`}
              >
                {hasError ? (
                  <AlertCircle size={20} />
                ) : isCompleted ? (
                  <Check size={20} />
                ) : (
                  stepNumber
                )}
              </button>
              <span className="mt-2 text-sm text-gray-700 text-center hidden md:block">
                {STEP_LABELS[stepNumber - 1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
