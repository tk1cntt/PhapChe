'use client';

import ServiceCard, { ServiceOption } from './ServiceCard';
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';

interface ServiceTypeSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  locale?: string;
}

function mapMatterTypeToServiceOption(key: string, matterType: typeof SEED_MATTER_TYPES[keyof typeof SEED_MATTER_TYPES], locale: string): ServiceOption {
  // Map trademark_registration to 'trademark' for UI compatibility
  const id = key === 'trademark_registration' ? 'trademark' : key;

  // Add appropriate tag based on MatterType
  const tags: ServiceOption['tags'] = [];
  if (key === 'agency_contract') {
    tags.push({ label: { vi: 'Khuyến nghị', en: 'Recommended', zh: '推荐', ja: 'おすすめ' }, variant: 'green' });
  } else if (key === 'labor_contract') {
    tags.push({ label: { vi: 'Nhanh', en: 'Fast', zh: '快速', ja: '快速' }, variant: 'blue' });
  } else if (key === 'trademark_registration') {
    tags.push({ label: { vi: 'IP', en: 'IP', zh: '知识产权', ja: 'IP' }, variant: 'purple' });
  } else if (key === 'unsupported') {
    tags.push({ label: { vi: 'Phân loại', en: 'Classify', zh: '分类', ja: '分類' }, variant: 'red' });
  }

  // Add estimated time for agency contract
  const estimatedTime = key === 'agency_contract'
    ? { vi: '2-3 ngày', en: '2-3 days', zh: '2-3天', ja: '2〜3日' }
    : undefined;

  return {
    id,
    title: matterType.label as Record<string, string>,
    description: matterType.description as Record<string, string>,
    tags,
    estimatedTime,
  };
}

export default function ServiceTypeSelector({ selectedId, onSelect, locale = 'vi' }: ServiceTypeSelectorProps) {
  // Build service options from SEED_MATTER_TYPES
  const SERVICE_OPTIONS: ServiceOption[] = Object.entries(SEED_MATTER_TYPES).map(([key, matterType]) =>
    mapMatterTypeToServiceOption(key, matterType, locale)
  );

  return (
    <div className="space-y-4">
      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '18px' }}>
        Chọn loại dịch vụ pháp lý bạn cần hỗ trợ
      </p>
      {SERVICE_OPTIONS.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          selected={service.id === selectedId}
          onSelect={() => onSelect(service.id)}
          locale={locale}
        />
      ))}
    </div>
  );
}
