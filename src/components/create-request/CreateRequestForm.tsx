'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { WizardProvider, useWizard } from './WizardProvider';
import WizardSteps from './WizardSteps';
import LegalDomainSelector from './LegalDomainSelector';
import ServiceTypeList from './ServiceTypeList';
import IntakeQuestionsFormEnhanced, { validateQuestionsForm } from './IntakeQuestionsFormEnhanced';
import FileUploadZone from './FileUploadZone';
import ReviewStep from './ReviewStep';
import SummaryPanel from './SummaryPanel';
import ChecklistPanel from './ChecklistPanel';
import type { WizardState } from '@/lib/types/wizard';

interface CreateRequestFormProps {
  workspaces?: Array<{ id: string; name: string; slug: string }>;
  workspaceName?: string;
  locale?: string;
  userContactInfo?: {
    email?: string;
    phone?: string;
    companyName?: string;
    taxCode?: string;
  };
}

/**
 * Inner wizard form component that uses WizardContext
 */
function WizardForm({ locale = 'vi', workspaceName = '', userContactInfo }: CreateRequestFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, actions } = useWizard();
  const t = useTranslations('CreateRequest');

  const fileMapRef = useRef<Map<string, File>>(new Map());

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [stepErrors, setStepErrors] = useState<Record<number, boolean>>({});
  const [isFetchingDraft, setIsFetchingDraft] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Calculate completed steps
  const completedSteps: number[] = [];
  if (state.domainId) completedSteps.push(1);
  if (state.serviceType) completedSteps.push(2);
  if (Object.keys(state.answers).length > 0) completedSteps.push(3);
  if (state.files.length > 0) completedSteps.push(4);

  // Initialize contact info from user profile
  useEffect(() => {
    if (userContactInfo?.email) {
      actions.setContact({
        email: userContactInfo.email ?? '',
        phone: userContactInfo.phone ?? '',
        companyName: userContactInfo.companyName ?? '',
        taxCode: userContactInfo.taxCode ?? '',
      });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume draft from URL query param
  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (draftId && !state.draftId) {
      setIsFetchingDraft(true);
      fetch(`/api/intake/draft/${draftId}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Draft not found');
        })
        .then((data) => {
          if (data.data) {
            actions.setDomain(data.data.domainId || '');
            actions.setService(data.data.serviceType || '');
            Object.entries(data.data.answers || {}).forEach(([key, value]) => {
              actions.setAnswer(key, value as string);
            });
            actions.setPriority(data.data.priority || 'normal');
            if (data.data.contactInfo) {
              actions.setContact(data.data.contactInfo);
            }
            actions.setDraftId(draftId);
            setShowDraftBanner(true);
          }
        })
        .catch(() => {
          // Draft not found, continue with empty form
        })
        .finally(() => {
          setIsFetchingDraft(false);
        });
    }
  }, [searchParams, state.draftId, actions]);

  // Update URL query params when step changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('step', state.step.toString());
    if (state.draftId) {
      params.set('draftId', state.draftId);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [state.step, state.draftId, router]);

  // Validate current step before navigation
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (state.step === 1) {
      if (!state.domainId) {
        errors.domainId = t('error.selectDomain');
      }
    } else if (state.step === 2) {
      if (!state.serviceType) {
        errors.serviceType = t('error.selectService');
      }
    } else if (state.step === 3) {
      if (state.serviceType) {
        const questionErrors = validateQuestionsForm(state.serviceType, state.answers);
        Object.assign(errors, questionErrors);
      }
    }

    setValidationErrors(errors);
    const hasErrors = Object.keys(errors).length > 0;
    setStepErrors((prev) => ({ ...prev, [state.step]: hasErrors }));
    return !hasErrors;
  };

  // Save draft to backend
  const saveDraft = async () => {
    if (!state.domainId || !state.serviceType) return;

    try {
      const response = await fetch('/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: state.draftId,
          domainId: state.domainId,
          serviceType: state.serviceType,
          answers: state.answers,
          files: state.files,
          priority: state.priority,
          contactInfo: state.contactInfo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        actions.setDraftId(data.draftId);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Handle next step with validation and auto-save
  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    // Auto-save draft before moving to next step
    await saveDraft();

    if (state.step < 5) {
      actions.nextStep();
    }
  };

  // Handle previous step
  const handlePrev = () => {
    if (state.step > 1) {
      actions.prevStep();
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!state.domainId || !state.serviceType) {
      throw new Error(t('error.missingRequiredInfo'));
    }

    const formData = new FormData();
    formData.append('data', JSON.stringify({
      draftId: state.draftId,
      domainId: state.domainId,
      serviceType: state.serviceType,
      answers: state.answers,
      files: state.files,
      priority: state.priority,
      contactInfo: state.contactInfo,
    }));

    // Attach actual File objects from fileMapRef
    for (const [vaultFileId, file] of fileMapRef.current) {
      formData.append('files', file, file.name);
    }

    const response = await fetch('/api/intake/submit', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || t('error.submitFailed'));
    }
  };

  // Delete draft and start over
  const handleDeleteDraft = async () => {
    if (state.draftId) {
      try {
        await fetch(`/api/intake/draft/${state.draftId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }
    actions.reset();
    router.replace('/create', { scroll: false });
    setShowDraftBanner(false);
  };

  // Loading state for draft fetch
  if (isFetchingDraft) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="create-request-container">
      {/* Draft Resume Banner */}
      {showDraftBanner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">{t('message.resumeDraft')}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {t('message.resumeDraftDesc')}
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteDraft}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
{t('button.startOver')}
            </button>
          </div>
        </div>
      )}

      {/* Wizard Steps */}
      <div className="wizard-steps-wrapper">
        <WizardSteps
          currentStep={state.step}
          totalSteps={5}
          completedSteps={completedSteps}
          validationErrors={stepErrors}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="main-grid">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="form-card">
            <div className="card-body">
              {/* Step 1: Domain Selection */}
              {state.step === 1 && (
                <LegalDomainSelector
                  selectedDomainId={state.domainId}
                  onSelect={actions.setDomain}
                  locale={locale}
                />
              )}

              {/* Step 2: Service Type Selection */}
              {state.step === 2 && state.domainId && (
                <ServiceTypeList
                  selectedDomainId={state.domainId}
                  selectedServiceType={state.serviceType}
                  onSelect={actions.setService}
                  onBack={actions.prevStep}
                  locale={locale}
                />
              )}

              {/* Step 3: Questions */}
              {state.step === 3 && state.serviceType && (
                <IntakeQuestionsFormEnhanced
                  serviceType={state.serviceType}
                  answers={state.answers}
                  onAnswerChange={actions.setAnswer}
                  errors={validationErrors}
                  locale={locale}
                />
              )}

              {/* Step 4: File Upload */}
              {state.step === 4 && (
                <FileUploadZone
                  files={state.files}
                  onFileAdd={actions.addFile}
                  onFileRemove={actions.removeFile}
                  onFileStore={(id, file) => { fileMapRef.current.set(id, file); }}
                  onFileUnstore={(id) => { fileMapRef.current.delete(id); }}
                  locale={locale}
                />
              )}

              {/* Step 5: Review */}
              {state.step === 5 && (
                <ReviewStep
                  state={state}
                  onEdit={actions.goToStep}
                  onSubmit={handleSubmit}
                  locale={locale}
                  userContactInfo={userContactInfo}
                />
              )}

              {/* Navigation Buttons */}
              {state.step < 5 && (
                <div className="form-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={handlePrev}
                    disabled={state.step === 1}
                  >
                    {t('button.back')}
                  </button>
                  <button
                    type="button"
                    className="create-btn"
                    onClick={handleNext}
                  >
                    {t('button.next')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Side Panels */}
        <div className="side-panels">
          <SummaryPanel
            selectedDomainId={state.domainId ?? undefined}
            selectedService={state.serviceType || ''}
            workspaceName={workspaceName}
            locale={locale}
          />
          <ChecklistPanel
            selectedService={state.serviceType ?? undefined}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Main CreateRequestForm component wrapped with WizardProvider
 */
export default function CreateRequestForm(props: CreateRequestFormProps) {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialStep = searchParams?.get('step') ? parseInt(searchParams.get('step')!) as 1 | 2 | 3 | 4 | 5 : undefined;

  const initialDraft: Partial<WizardState> | undefined = initialStep
    ? { step: initialStep }
    : undefined;

  return (
    <WizardProvider initialDraft={initialDraft}>
      <WizardForm {...props} />
    </WizardProvider>
  );
}
