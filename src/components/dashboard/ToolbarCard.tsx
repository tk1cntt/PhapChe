'use client';

import { useTranslations } from 'next-intl';

interface ToolbarCardProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function ToolbarCard({ searchTerm, onSearchChange }: ToolbarCardProps) {
  const t = useTranslations('ToolbarCard');

  return (
    <div className="toolbar-card">
      <div className="toolbar">
        <div className="left-tools">
          <div className="request-search">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button className="tool-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
            </svg>
            {t('filter')}
          </button>
          <button className="tool-btn">
            {t('status')}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        <div className="right-tools">
          <button className="tool-btn square">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 16v5h5" />
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 8V3h-5" />
            </svg>
          </button>
          <button className="tool-btn">{t('export')}</button>
          <button className="tool-btn">{t('columns')}</button>
        </div>
      </div>
    </div>
  );
}
