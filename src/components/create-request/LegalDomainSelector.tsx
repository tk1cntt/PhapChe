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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chọn lĩnh vực pháp lý</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              className={`relative h-40 p-5 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02] ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon size={40} className="text-blue-500 mb-3" />
              <h3 className="font-semibold text-base text-gray-900 mb-1">{label}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</p>
              <span className="absolute bottom-3 right-3 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {serviceCount} dịch vụ
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
