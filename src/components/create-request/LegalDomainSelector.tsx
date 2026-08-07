'use client';

import {
  Briefcase,
  Building,
  Users,
  Shield,
  Package,
  FileCheck,
  Bot,
  Lightbulb,
  Scale,
  Heart,
  GraduationCap,
  Hammer,
  Plug,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SEED_LEGAL_DOMAINS } from '@/lib/i18n/seed-legal-domains';

interface LegalDomainSelectorProps {
  selectedDomainId: string | null;
  onSelect: (domainId: string) => void;
  locale?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Briefcase,
  Building,
  Users,
  Shield,
  Package,
  FileCheck,
  Bot,
  Lightbulb,
  Scale,
  Heart,
  GraduationCap,
  Hammer,
  Plug,
};

export default function LegalDomainSelector({
  selectedDomainId,
  onSelect,
  locale = 'vi',
}: LegalDomainSelectorProps) {
  const t = useTranslations('CreateRequest');
  const domains = getLegalDomains();

  return (
    <div className="w-full">
      <h2 className="domain-title">{t('domainTitle')}</h2>
      <div className="domain-grid">
        {domains.map((domain) => {
          const Icon = ICON_MAP[domain.icon] || Briefcase;
          const isSelected = selectedDomainId === domain.key;
          const t = getLocalizedString;
          const label = t(domain.label, locale);
          const description = t(domain.description, locale);
          const description = t(domain.description, locale);

          return (
            <button
              key={domain.key}
              type="button"
              onClick={() => onSelect(domain.key)}
              className={`domain-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="domain-icon">
                <Icon size={36} />
              </div>
              <h3 className="domain-name">{label}</h3>
              <p className="domain-desc">{description}</p>
              <span className="domain-count">{t('serviceCount', { count: serviceCount })}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
