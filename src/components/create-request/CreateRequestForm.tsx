'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import WizardSteps from './WizardSteps';
import ServiceTypeSelector from './ServiceTypeSelector';
import IntakeQuestionsForm from './IntakeQuestionsForm';
import SummaryPanel from './SummaryPanel';
import ChecklistPanel from './ChecklistPanel';

interface UploadedFile {
  vaultFileId: string;
  filename: string;
  size: number;
}

interface IntakeAnswers {
  [key: string]: string;
}

interface CreateRequestFormProps {
  workspaces?: Array<{ id: string; name: string; slug: string }>;
  workspaceName?: string;
  locale?: string;
}

export default function CreateRequestForm({ workspaces = [], workspaceName = '', locale = 'vi' }: CreateRequestFormProps) {
  const t = useTranslations('UserCreateRequest');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState('agency_contract');

  // Draft state
  const [requestId, setRequestId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [answersValid, setAnswersValid] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Step 3: Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 4: Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createDraft = async (answersToSave: IntakeAnswers) => {
    setIsCreatingDraft(true);
    try {
      const response = await fetch('/api/intake/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matterTypeKey: selectedService === 'trademark' ? 'trademark_registration' : selectedService,
          answers: answersToSave,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create draft');
      }

      const data = await response.json();
      setRequestId(data.id);
      return true;
    } catch (error) {
      console.error('Failed to create draft:', error);
      setErrors({ draft: 'Failed to create draft. Please try again.' });
      return false;
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleNext = async () => {
    setErrors({});

    if (currentStep === 1) {
      // Step 1 → 2: Create draft with answers
      const success = await createDraft(answers);
      if (success) {
        setCurrentStep(2);
      }
      return;
    }

    if (currentStep === 2) {
      // Step 2 → 3: Validate answers before proceeding
      if (!answersValid) {
        setErrors({ answers: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      // Create draft if needed
      if (!requestId) {
        const success = await createDraft(answers);
        if (!success) return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('requestId', requestId!);

      const response = await fetch('/api/intake/attach-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Upload failed');
      }

      setUploadedFiles((prev) => [
        ...prev,
        {
          vaultFileId: data.vaultFileId,
          filename: data.filename,
          size: data.size,
        },
      ]);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setErrors({ upload: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (vaultFileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.vaultFileId !== vaultFileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    if (!requestId) {
      setSubmitError('No request to submit');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Submit failed');
      }

      setSubmitSuccess(true);

      setTimeout(() => {
        window.location.href = `/${locale}/dashboard`;
      }, 2000);
    } catch (error) {
      console.error('Submit failed:', error);
      setSubmitError(error instanceof Error ? error.message : 'Submit failed');
      setErrors({ submit: error instanceof Error ? error.message : 'Submit failed' });
    } finally {
      setIsSubmitting(false);
    }
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
              <h2 className="card-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M9 13h6"/>
                </svg>
                {t('formTitle')}
              </h2>
              <span className="step-badge">{t('stepBadge', { current: currentStep, total: 4 })}</span>
            </div>

            <div className="card-body">
              {/* Error Display */}
              {errors.answers && (
                <div className="text-red-500 text-sm mb-4">{errors.answers}</div>
              )}
              {errors.draft && (
                <div className="text-red-500 text-sm mb-4">{errors.draft}</div>
              )}

              {/* Step 1: Service Selection */}
              {currentStep === 1 && (
                <ServiceTypeSelector
                  selectedId={selectedService}
                  onSelect={setSelectedService}
                  locale={locale}
                />
              )}

              {/* Step 2: Questions */}
              {currentStep === 2 && (
                <IntakeQuestionsForm
                  selectedService={selectedService}
                  onAnswersChange={setAnswers}
                  onValidChange={setAnswersValid}
                  locale={locale}
                />
              )}

              {/* Step 3: Upload */}
              {currentStep === 3 && (
                <div className="documents-step">
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '18px' }}>
                    Tải lên tài liệu liên quan để hỗ trợ yêu cầu của bạn
                  </p>

                  <div
                    className="upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '32px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#f8fafc',
                      marginBottom: '16px',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        <p style={{ color: '#64748b' }}>Đang tải lên...</p>
                      </div>
                    ) : (
                      <>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ margin: '0 auto 12px' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <p style={{ color: '#64748b', marginBottom: '4px' }}>
                          Kéo thả file vào đây hoặc <span style={{ color: '#0d9488', fontWeight: 600 }}>chọn file</span>
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '12px' }}>PDF, DOC, DOCX, JPG, PNG (tối đa 50MB)</p>
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <div className="text-red-500 text-sm mb-4">{uploadError}</div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="uploaded-files-list">
                      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                        Đã tải lên ({uploadedFiles.length})
                      </p>
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.vaultFileId}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          style={{ marginBottom: '8px' }}
                        >
                          <div className="flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <path d="M14 2v6h6"/>
                            </svg>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 500 }}>{file.filename}</p>
                              <p style={{ fontSize: '12px', color: '#64748b' }}>{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(file.vaultFileId)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="review-step">
                  {submitSuccess ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Yêu cầu đã được gửi thành công!</h3>
                      <p style={{ color: '#64748b' }}>Bạn sẽ được chuyển hướng đến trang chủ trong giây lát...</p>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '18px' }}>
                        Kiểm tra thông tin trước khi gửi yêu cầu
                      </p>

                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: '14px', color: '#64748b' }}>Loại dịch vụ</span>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{selectedService}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: '14px', color: '#64748b' }}>Tài liệu đính kèm</span>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{uploadedFiles.length} file(s)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: '14px', color: '#64748b' }}>Trạng thái</span>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#0d9488' }}>Sẵn sàng gửi</span>
                        </div>
                      </div>

                      {submitError && (
                        <div className="text-red-500 text-sm mb-4">{submitError}</div>
                      )}

                      <button
                        type="button"
                        className="w-full create-btn"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{ marginTop: '16px' }}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Đang gửi...
                          </span>
                        ) : (
                          t('submit')
                        )}
                      </button>
                    </>
                  )}
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
                  {currentStep < 4 && (
                    <button
                      type="button"
                      className="create-btn"
                      onClick={handleNext}
                      disabled={isCreatingDraft}
                    >
                      {isCreatingDraft ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang xử lý...
                        </span>
                      ) : (
                        <>
                          {t('continue')}
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M5 12h14"/>
                            <path d="m12 5 7 7-7 7"/>
                          </svg>
                        </>
                      )}
                    </button>
                  )}
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
