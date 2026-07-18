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
          className="back-btn"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <p className="text-gray-600">Không tìm thấy lĩnh vực</p>
      </div>
    );
  }

  const tKey = (locale || 'vi') as 'vi' | 'en' | 'zh' | 'ja';
  const domainLabel = domain.label[tKey] || domain.label.vi;
  const serviceTypes = domain.matterTypeKeys
    .map((k) => {
      const entry = SEED_MATTER_TYPES[k];
      if (!entry) return undefined;
      const { key: _key, ...rest } = entry;
      return { key: k, ...rest };
    })
    .filter((st): st is NonNullable<typeof st> => st !== undefined);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onBack}
        className="back-btn"
      >
        <ArrowLeft size={18} />
        Quay lại
      </button>

      <h2 className="domain-title">{domainLabel}</h2>
      <p className="domain-subtitle">Chọn loại dịch vụ bạn cần</p>

      <div className="service-list">
        {serviceTypes.map((serviceType) => {
          const isSelected = selectedServiceType === serviceType.key;
          const label = serviceType.label[locale as keyof typeof serviceType.label] || serviceType.label.vi;
          const description = serviceType.description[locale as keyof typeof serviceType.description] || serviceType.description.vi;

          return (
            <button
              key={serviceType.key}
              type="button"
              onClick={() => onSelect(serviceType.key)}
              className={`service-option ${isSelected ? 'selected' : ''}`}
            >
              <div className="radio"></div>
              <div className="service-info">
                <strong>{label}</strong>
                <span>{description}</span>
              </div>
              <div className="service-meta">
                <span className="tag blue">{serviceType.questions.length} câu</span>
                <span className="tag green">{serviceType.questions.filter((q) => q.required).length} bắt buộc</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
