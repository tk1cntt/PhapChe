'use client';

import { useTranslations } from 'next-intl';

interface SummaryPanelProps {
  selectedService: string;
  workspaceName: string;
}

const SERVICE_NAMES = {
  agency_contract: 'Soạn hợp đồng đại lý',
  labor_contract: 'Soạn hợp đồng lao động',
  trademark: 'Đăng ký nhãn hiệu',
  unsupported: 'Dịch vụ khác / chưa rõ loại việc',
  'agent-contract': 'Soạn hợp đồng đại lý',
  'labor-contract': 'Soạn hợp đồng lao động',
  other: 'Dịch vụ khác / chưa rõ loại việc',
};

function MiniIcon({ letter }: { letter: string }) {
  return <div className="mini-icon">{letter}</div>;
}

export default function SummaryPanel({ selectedService, workspaceName }: SummaryPanelProps) {
  const t = useTranslations('UserCreateRequest');
  const serviceName = SERVICE_NAMES[selectedService as keyof typeof SERVICE_NAMES] || SERVICE_NAMES.other;

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
          <div className="summary-item">
            <div>
              <strong>Dịch vụ đã chọn</strong>
              <span>{serviceName}</span>
            </div>
            <MiniIcon letter="1" />
          </div>

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
              <span>2-3 ngày làm việc sau khi đủ tài liệu</span>
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
