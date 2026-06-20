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
  const t = useTranslations('UserCreateRequest');

  // Get service info from seed data
  const serviceInfo = selectedService ? SEED_MATTER_TYPES[selectedService] : null;
  const domainInfo = selectedDomainId ? SEED_LEGAL_DOMAINS[selectedDomainId] : null;

  const serviceName = serviceInfo
    ? (serviceInfo.label[locale as keyof typeof serviceInfo.label] || serviceInfo.label.vi)
    : 'Chưa chọn dịch vụ';

  const domainName = domainInfo
    ? (domainInfo.label[locale as keyof typeof domainInfo.label] || domainInfo.label.vi)
    : '';

  return (
    <div className="side-card">
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
          {selectedService ? (
            <div className="summary-item">
              <div>
                <strong>Dịch vụ đã chọn</strong>
                <span>{serviceName}</span>
              </div>
              <MiniIcon letter="1" />
            </div>
          ) : selectedDomainId ? (
            <div className="summary-item">
              <div>
                <strong>Lĩnh vực đã chọn</strong>
                <span>{domainName}</span>
              </div>
              <MiniIcon letter="1" />
            </div>
          ) : (
            <div className="summary-item">
              <div>
                <strong>Chưa chọn dịch vụ</strong>
                <span>Vui lòng chọn dịch vụ pháp lý</span>
              </div>
              <MiniIcon letter="?" />
            </div>
          )}

          <div className="summary-item">
            <div>
              <strong>{t('workspace')}</strong>
              <span>{workspaceName}</span>
            </div>
            <MiniIcon letter="W" />
          </div>

          <div className="summary-item">
            <div>
              <strong>Dự kiến xử lý</strong>
              <span>{serviceInfo ? '2-3 ngày làm việc sau khi đủ tài liệu' : 'Chọn dịch vụ để biết thời gian'}</span>
            </div>
            <MiniIcon letter="S" />
          </div>

          <div className="summary-item">
            <div>
              <strong>Trạng thái</strong>
              <span>Hồ sơ nháp, chưa gửi cho chuyên viên</span>
            </div>
            <MiniIcon letter="D" />
          </div>
        </div>
      </div>
    </div>
  );
}
