'use client';

import { Check } from 'lucide-react';

interface WizardStepsProps {
  currentStep: number;
  steps?: string[];
}

const DEFAULT_STEPS = ['Dich vu', 'Cau hoi', 'Tai lieu', 'Kiem tra'];

export default function WizardSteps({ currentStep, steps = DEFAULT_STEPS }: WizardStepsProps) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((step, index) => {
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
            {index < steps.length - 1 && (
              <div className="h-0.5 w-12 bg-slate-200 rounded-full" />
            )}
          </div>
        );
      })}
    </div>
  );
}
