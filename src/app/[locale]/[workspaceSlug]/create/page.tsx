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

const PAGE_TEXT = {
  vi: {
    title: 'Gửi yêu cầu pháp lý',
    subtitle: 'Trả lời vài câu hỏi để chuyên viên có đủ thông tin tiếp nhận hồ sơ và xử lý đúng SLA.',
    btnDraft: 'Lưu nháp',
    btnViewDraft: 'Xem hồ sơ nháp',
    serviceHeader: 'Bạn cần hỗ trợ việc gì?',
    stepBadge: 'Bước 1 / 4',
    formSection: 'Thông tin sơ bộ',
  langSupport: 'Hỗ trợ 4 ngôn ngữ: VI, EN, ZH, JA',
  langActive: 'Tiếng Việt',
  langInactive: ['English', '中文', '日本語'],
  chatLabel: 'Hỗ trợ',
  chatLabelShort: 'Hỗ trợ',
  },
  en: {
    title: 'Submit Legal Request',
    subtitle: 'Answer a few questions so specialists have enough information to process your request.',
    btnDraft: 'Save Draft',
    btnViewDraft: 'View Draft',
    serviceHeader: 'What do you need help with?',
    stepBadge: 'Step 1 / 4',
    formSection: 'Basic Information',
    langSupport: 'Support 4 languages: VI, EN, ZH, JA',
    langActive: 'Tiếng Việt',
    langInactive: ['English', '中文', '日本語'],
    chatLabel: 'Support',
    chatLabelShort: 'Support',
  },
  zh: {
    title: '提交法律请求',
    subtitle: '回答几个问题，以便專家有足夠的信息處理您的請求',
    btnDraft: '保存草稿',
    btnViewDraft: '查看草稿',
    serviceHeader: '您需要什麼幫助？',
    stepBadge: '第1步 / 4',
    formSection: '基本信息',
    langSupport: '支持4种语言',
    langActive: 'Tiếng Việt',
    langInactive: ['English', '中文', '日本語'],
    chatLabel: '支持',
    chatLabelShort: '支持',
  },
  ja: {
    title: '法的要求を送信',
    subtitle: '專家が情報を處理できるように質問に答えてください',
    btnDraft: '下書き保存',
    btnViewDraft: '下書きを見る',
    serviceHeader: '何をお手伝いしましょうか？',
    stepBadge: 'ステップ1 / 4',
    formSection: '基本情報',
    langSupport: '4言語サポート',
    langActive: 'Tiếng Việt',
    langInactive: ['English', '中文', '日本語'],
    chatLabel: 'サポート',
    chatLabelShort: '支援',
  },
};

export default function CreateRequestPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  // Demo user data
  const userName = 'Mai Phương';
  const userRole = 'Customer';
  const workspaceName = 'Công ty An Phát';

  // State for service selection
  const [selectedService, setSelectedService] = useState<string>('agent-contract');
  const [locale, setLocale] = useState<'vi' | 'en' | 'zh' | 'ja'>('vi');

  const t = PAGE_TEXT[locale] || PAGE_TEXT.vi;

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
              {t.title}
            </h1>
            <p className="text-[15px] text-slate-500 font-medium">
              {t.subtitle}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="h-11 px-4 border border-slate-200 bg-white rounded-lg text-slate-800 font-bold">
              {t.btnDraft}
            </button>
            <button className="h-11 px-5 bg-gradient-to-b from-teal-600 to-teal-700 text-white rounded-lg font-bold shadow-lg shadow-teal-600/25 flex items-center gap-2">
              <span>{t.btnViewDraft}</span>
            </button>
          </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
            {t.langSupport}
            {t.langInactive.map((lang) => (
              <button key={lang} onClick={() => setLocale(lang as 'vi' | 'en' | 'zh' | 'ja')}>{lang}</button>
            ))}
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
                    {t.serviceHeader}
                  </h2>
                </div>
                <span className="h-8 px-4 flex items-center rounded-full bg-orange-100 text-orange-700 text-xs font-extrabold">
                  {t.stepBadge}
                </span>
              </div>
              <div className="p-6">
                <ServiceTypeSelector
                  selectedId={selectedService}
                  onSelect={setSelectedService}
                />

                {/* Form Fields */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">{t.formSection}</h3>
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
      </div>

      {/* Floating Chat */}
      <FloatingChatButton />
    </UserLayout>
  );
}
