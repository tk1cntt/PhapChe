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
  const domains = Object.values(SEED_LEGAL_DOMAINS);

  return (
    <div className="w-full">
      <h2 className="domain-title">Chọn lĩnh vực pháp lý</h2>
      <div className="domain-grid">
        {domains.map((domain) => {
          const Icon = ICON_MAP[domain.icon] || Briefcase;
          const isSelected = selectedDomainId === domain.key;
          const label = domain.label[locale as keyof typeof domain.label] || domain.label.vi;
          const description = domain.description[locale as keyof typeof domain.description] || domain.description.vi;
          const serviceCount = domain.matterTypeKeys.length;

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
              <span className="domain-count">{serviceCount} dịch vụ</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
