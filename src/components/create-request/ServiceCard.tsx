'use client';

export interface ServiceOption {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  tags: Array<{ label: Record<string, string>; variant: 'green' | 'blue' | 'orange' | 'purple' | 'red' }>;
  estimatedTime?: Record<string, string>;
}

interface ServiceCardProps {
  service: ServiceOption;
  selected: boolean;
  onSelect: () => void;
  locale?: string;
}

export default function ServiceCard({ service, selected, onSelect, locale = 'vi' }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`service-option ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
    >
      <span className="radio" aria-hidden="true" />
      <span className="service-info">
        <strong>{t(service.title)}</strong>
        <span>{t(service.description)}</span>
      </span>
      <span className="service-meta">
        {service.tags.map((tag) => (
          <span key={tag.label.vi} className={`tag ${tag.variant}`}>
            {t(tag.label)}
          </span>
        ))}
        {service.estimatedTime && (
          <span className="tag blue">
            {t(service.estimatedTime)}
          </span>
        )}
      </span>
    </button>
  );
}
