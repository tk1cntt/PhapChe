'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export interface CaseInfo {
  caseCode: string;
  slaRemaining: string;
  slaDetail: string;
  documents: string;
  participants: string;
}

export interface InfoPanelProps {
  caseInfo: CaseInfo | null;
  onOpenCase: () => void;
}

function InfoPanel({ caseInfo, onOpenCase }: InfoPanelProps): React.ReactElement {
  const t = useTranslations('UserMessages');

  if (!caseInfo) {
    return (
      <div className="info-panel">
        <div className="info-placeholder">{t('noThreadSelected')}</div>
      </div>
    );
  }

  return (
    <div className="info-panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
          {t('caseInfo')}
        </div>
      </div>

      <div className="info-box">
        <strong>{t('caseCode')}</strong>
        <span>{caseInfo.caseCode}</span>
      </div>

      <div className="info-box">
        <strong>{t('slaRemaining')}</strong>
        <span>{caseInfo.slaRemaining} · {caseInfo.slaDetail}</span>
      </div>

      <div className="info-box">
        <strong>{t('relatedDocs')}</strong>
        <span>{caseInfo.documents}</span>
      </div>

      <div className="info-box">
        <strong>{t('participants')}</strong>
        <span>{caseInfo.participants}</span>
      </div>

      <button className="ghost-btn" onClick={onOpenCase}>
        {t('openCase')}
      </button>
    </div>
  );
}

export default InfoPanel;
