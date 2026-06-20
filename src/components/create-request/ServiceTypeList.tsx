'use client';

import { ArrowLeft } from 'lucide-react';
import { SEED_LEGAL_DOMAINS, SEED_MATTER_TYPES } from '@/lib/i18n/seed-legal-domains';

interface ServiceTypeListProps {
  selectedDomainId: string;
  selectedServiceType: string | null;
  onSelect: (serviceTypeKey: string) => void;
  onBack: () => void;
  locale?: string;
}

export default function ServiceTypeList({
  selectedDomainId,
  selectedServiceType,
  onSelect,
  onBack,
  locale = 'vi',
}: ServiceTypeListProps) {
  const domain = SEED_LEGAL_DOMAINS[selectedDomainId];

  if (!domain) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Quay lại
        </button>
        <p className="text-gray-600">Không tìm thấy lĩnh vực</p>
      </div>
    );
  }

  const domainLabel = domain.label[locale as keyof typeof domain.label] || domain.label.vi;
  const serviceTypes = domain.matterTypeKeys
    .map((key) => ({
      key,
      ...SEED_MATTER_TYPES[key],
    }))
    .filter((st) => st !== undefined);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">{domainLabel}</h2>
      <p className="text-gray-600 mb-6">Chọn loại dịch vụ bạn cần</p>

      <div className="space-y-3">
        {serviceTypes.map((serviceType) => {
          const isSelected = selectedServiceType === serviceType.key;
          const label = serviceType.label[locale as keyof typeof serviceType.label] || serviceType.label.vi;
          const description = serviceType.description[locale as keyof typeof serviceType.description] || serviceType.description.vi;

          return (
            <button
              key={serviceType.key}
              type="button"
              onClick={() => onSelect(serviceType.key)}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left hover:border-blue-300 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{label}</h3>
              <p className="text-sm text-gray-600 mb-3">{description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{serviceType.questions.length} câu hỏi</span>
                <span className="flex items-center gap-1">
                  {serviceType.questions.filter((q) => q.required).length} bắt buộc
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
