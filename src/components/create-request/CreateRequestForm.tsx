'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import WizardSteps from './WizardSteps';
import ServiceTypeSelector from './ServiceTypeSelector';
import RequestForm from './RequestForm';
import SummaryPanel from './SummaryPanel';
import ChecklistPanel from './ChecklistPanel';

interface CreateRequestFormProps {
  workspaces: Array<{ id: string; name: string; slug: string }>;
  workspaceName?: string;
}

export default function CreateRequestForm({ workspaces, workspaceName = '' }: CreateRequestFormProps) {
  const t = useTranslations('UserCreateRequest');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState('agent-contract');

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="create-request-container">
      {/* Wizard Steps */}
      <div className="wizard-steps-wrapper">
        <WizardSteps currentStep={currentStep} />
      </div>

      {/* Main Grid Layout */}
      <div className="main-grid">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="form-card">
            <div className="card-header">
              <h2 className="card-title">{t('formTitle')}</h2>
              <span className="step-badge">{t('step')} {currentStep} / 4</span>
            </div>

            <div className="card-body">
              {currentStep === 1 && (
                <ServiceTypeSelector
                  selectedId={selectedService}
                  onSelect={setSelectedService}
                />
              )}
              {currentStep === 2 && (
                <RequestForm workspaces={workspaces} />
              )}
              {currentStep === 3 && (
                <div className="placeholder-content">
                  <p>{t('documentsStep')}</p>
                </div>
              )}
              {currentStep === 4 && (
                <div className="placeholder-content">
                  <p>{t('reviewStep')}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => window.history.back()}
                >
                  {t('backToDashboard')}
                </button>
                <div className="action-buttons-right">
                  <button type="button" className="ghost-btn">
                    {t('saveDraft')}
                  </button>
                  <button
                    type="button"
                    className="create-btn"
                    onClick={handleNext}
                    disabled={currentStep === 4}
                  >
                    {currentStep === 4 ? t('submit') : t('continue')}
                    {currentStep < 4 && (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Side Panels */}
        <div className="side-panels">
          <SummaryPanel selectedService={selectedService} workspaceName={workspaceName} />
          <ChecklistPanel />
        </div>
      </div>
    </div>
  );
}
