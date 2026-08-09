'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GUIDED_SCENARIOS } from '@/lib/i18n/guided-scenarios';

interface GuidedScenarioSelectorProps {
  onSelect: (scenarioKey: string) => void;
  locale?: string;
}

/**
 * Step 0 — Guided Discovery
 * Người dùng chọn tình huống đời thường thay vì phải hiểu 13 lĩnh vực pháp lý.
 * Style khớp với domain-card design system: icon gradient box, card elevation, hover animation.
 */
export default function GuidedScenarioSelector({
  onSelect,
  locale = 'vi',
}: GuidedScenarioSelectorProps) {
  const t = useTranslations('CreateRequest');

  return (
    <div className="w-full">
      {/* Intro */}
      <div className="guided-intro">
        <h2 className="guided-title">{t('guided.title')}</h2>
        <p className="guided-subtitle">{t('guided.description')}</p>
      </div>

      {/* Scenario Cards */}
      <div className="guided-scenario-grid">
        {GUIDED_SCENARIOS.map((scenario) => {
          const label = scenario.label[locale as keyof typeof scenario.label] || scenario.label.vi;
          const isOther = scenario.key === 'other';

          return (
            <button
              key={scenario.key}
              type="button"
              onClick={() => onSelect(scenario.key)}
              className={`guided-scenario-card${isOther ? ' other' : ''}`}
            >
              <div className="guided-scenario-icon">
                {scenario.icon}
              </div>
              <span className="guided-scenario-label">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Skip link cho user đã biết lĩnh vực */}
      <div className="text-center">
        <button
          type="button"
          className="guided-skip"
          onClick={() => onSelect('')}
        >
          {t('guided.skipToAllDomains')}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
