'use client';

import { useTranslations } from 'next-intl';

interface AdminBannerProps {
  title?: string;
  description?: string;
  onViewAudit?: () => void;
  onDispatchWorkload?: () => void;
}

export default function AdminBanner({
  title,
  description,
  onViewAudit,
  onDispatchWorkload,
}: AdminBannerProps) {
  const t = useTranslations('AdminDashboard');

  return (
    <div className="admin-banner">
      <div className="banner-left">
        <div className="banner-icon">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        <div>
          <h2>{title || t('bannerTitle')}</h2>
          <p>{description || t('bannerDescDefault')}</p>
        </div>
      </div>

      <div className="banner-actions">
        <button onClick={onViewAudit} className="ghost-btn">
          {t('viewAudit')}
        </button>
        <button onClick={onDispatchWorkload} className="create-btn">
          {t('dispatchWorkload')}
        </button>
      </div>
    </div>
  );
}
