'use client';

import { useTranslations } from 'next-intl';
import { SEED_MATTER_TYPES, SEED_LEGAL_DOMAINS } from '@/lib/i18n/seed-legal-domains';

interface SummaryPanelProps {
  selectedDomainId?: string;
  selectedService: string;
  workspaceName: string;
  locale?: string;
}

function MiniIcon({ letter }: { letter: string }) {
  return <div className="mini-icon">{letter}</div>;
}

export default function SummaryPanel({
  selectedDomainId,
  selectedService,
  workspaceName,
  locale = 'vi'
}: SummaryPanelProps) {
  const t = useTranslations('CreateRequest');

  const serviceInfo = selectedService ? SEED_MATTER_TYPES[selectedService] : null;
  const domainInfo = selectedDomainId ? SEED_LEGAL_DOMAINS[selectedDomainId] : null;

  function getLocalizedLabel<T extends { label: Record<string, string> }>(
    info: T | null,
    locale: string
  ): string {
    if (!info) return '';
    return (info.label as Record<string, string>)[locale] || info.label.vi || '';
  }

  const serviceName = getLocalizedLabel(serviceInfo, locale);
  const domainName = getLocalizedLabel(domainInfo, locale);

  const serviceName = getLocalizedLabel(serviceInfo, locale);
  const domainName = getLocalizedLabel(domainInfo, locale);
      <div className="card-header">
        <h3 className="card-title">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          {t('summaryPanelTitle')}
        </h3>
      </div>

      <div className="card-body">
        <div className="summary-list">
          {(() => {
            if (selectedService) {
              return (
                <div className="summary-item">
                  <div>
                    <strong>{t('summaryServiceSelected')}</strong>
                    <span>{serviceName}</span>
                  </div>
                  <MiniIcon letter="1" />
                </div>
              );
            }
            if (selectedDomainId) {
              return (
                <div className="summary-item">
                  <div>
                    <strong>{t('summaryDomainSelected')}</strong>
                    <span>{domainName}</span>
                  </div>
                  <MiniIcon letter="1" />
                </div>
              );
            }
            return (
              <div className="summary-item">
                <div>
                  <strong>{t('summaryNoService')}</strong>
                  <span>{t('summaryNoServiceHint')}</span>
                </div>
                <MiniIcon letter="?" />
              </div>
            );
          })()}
                <div>
                  <strong>{t('summaryNoService')}</strong>
                  <span>{t('summaryNoServiceHint')}</span>
                </div>
                <MiniIcon letter="?" />
              </div>
            );
          })()}

          <div className="summary-item">
            <div>
              <strong>{t('summaryEstimated')}</strong>
              <span>{serviceInfo ? t('summaryEstimatedTime') : t('summaryEstimatedPickService')}</span>
            </div>
            <MiniIcon letter="S" />
          </div>

          <div className="summary-item">
            <div>
              <strong>{t('status')}</strong>
              <span>{t('summaryDraftStatus')}</span>
            </div>
            <MiniIcon letter="D" />
          </div>
        </div>
      </div>
    </div>
  );
}
