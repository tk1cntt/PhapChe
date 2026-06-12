'use client';

import UserLayout from '@/app/[locale]/customer/components/UserLayout';
import WizardSteps from '@/components/create-request/WizardSteps';
import ServiceTypeSelector from '@/components/create-request/ServiceTypeSelector';
import SummaryPanel from '@/components/create-request/SummaryPanel';
import ChecklistPanel from '@/components/create-request/ChecklistPanel';
import RequestForm from '@/components/create-request/RequestForm';
import FloatingChatButton from '@/components/create-request/FloatingChatButton';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from '@/lib/auth-client';

export default function CreateRequestPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const t = useTranslations('UserCreateRequest');

  // Get real user data from session
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';
  const userRole = (session?.user as any)?.role || 'customer';
  const workspaceName = workspaceSlug.replace(/-/g, ' ');

  // State for service selection
  const [selectedService, setSelectedService] = useState<string>('agent-contract');

  return (
    <UserLayout
      userName={userName}
      userRole={userRole}
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
    >
      <div className="p-8">
        {/* Page Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-[31px] font-extrabold tracking-tight text-slate-900 mb-3">
              {t('pageTitle')}
            </h1>
            <p className="text-[15px] text-slate-500 font-medium">
              {t('pageDesc')}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="h-11 px-4 border border-slate-200 bg-white rounded-lg text-slate-800 font-bold">
              {t('cancel')}
            </button>
            <button className="h-11 px-5 bg-gradient-to-b from-teal-600 to-teal-700 text-white rounded-lg font-bold shadow-lg shadow-teal-600/25 flex items-center gap-2">
              <span>{t('submit')}</span>
            </button>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 mb-6">
          <WizardSteps currentStep={1} />
        </div>

        {/* Main Grid: Form + Sidebar */}
        <div className="grid grid-cols-[1fr_360px] gap-6">
          {/* Main Form Area */}
          <div className="space-y-6">
            {/* Service Selection Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="text-teal-700">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6"/>
                      <path d="M9 13h6"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {t('formTitle')}
                  </h2>
                </div>
                <span className="h-8 px-4 flex items-center rounded-full bg-orange-100 text-orange-700 text-xs font-extrabold">
                  {t('requestType')}
                </span>
              </div>
              <div className="p-6">
                <ServiceTypeSelector
                  selectedId={selectedService}
                  onSelect={setSelectedService}
                />

                {/* Form Fields */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">{t('description')}</h3>
                  <RequestForm />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <SummaryPanel
              selectedService={selectedService}
              workspaceName={workspaceName}
            />
            <ChecklistPanel />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200">
          <button className="h-11 px-4 border border-slate-200 bg-white rounded-lg text-slate-800 font-bold hover:bg-slate-50 transition-colors">
            {t('backToDashboard')}
          </button>
          <div className="flex gap-3">
            <button className="h-11 px-4 border border-slate-200 bg-white rounded-lg text-slate-800 font-bold hover:bg-slate-50 transition-colors">
              {t('saveDraft')}
            </button>
            <button className="h-11 px-5 bg-gradient-to-b from-teal-600 to-teal-700 text-white rounded-lg font-bold shadow-lg shadow-teal-600/25 flex items-center gap-2 hover:from-teal-700 hover:to-teal-800 transition-all">
              <span>{t('continue')}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingChatButton />
    </UserLayout>
  );
}
