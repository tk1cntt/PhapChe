'use client';

import { useTranslations } from 'next-intl';
import ServiceCard, { ServiceOption } from './ServiceCard';
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';

interface ServiceTypeSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  locale?: string;
}

function mapMatterTypeToServiceOption(key: string, matterType: typeof SEED_MATTER_TYPES[keyof typeof SEED_MATTER_TYPES]): ServiceOption {
  // Map trademark_registration to 'trademark' for UI compatibility
  const id = key === 'trademark_registration' ? 'trademark' : key;

  // Static lookup for per‑matter‑type UI overrides (tag, id mapping, estimated time)
  const config = MATTER_TYPE_UI_CONFIG[key];
  const id = config?.id ?? key;
  const tags: ServiceOption['tags'] = config?.tags ?? [];
  const estimatedTime = config?.estimatedTime;

  return {
    id,
    title: matterType.label as Record<string, string>,
    description: matterType.description as Record<string, string>,
    tags,
    estimatedTime,
  };
}

export default function ServiceTypeSelector({ selectedId, onSelect, locale = 'vi' }: ServiceTypeSelectorProps) {
  const t = useTranslations('Intake');

  // Build service options from SEED_MATTER_TYPES
  const SERVICE_OPTIONS: ServiceOption[] = Object.entries(SEED_MATTER_TYPES).map(([key, matterType]) =>
    mapMatterTypeToServiceOption(key, matterType)
  );

  return (
    <div className="space-y-4">
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '18px' }}>
        {t('serviceSelectionDesc')}
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
