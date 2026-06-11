'use client';

import React from 'react';

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

/**
 * InfoPanel component - displays case metadata in right column
 * Styling matches template (D-27 through D-31):
 * - Panel title: font-size 20px, font-weight 800
 * - Info boxes: border 1px solid #edf2f7, background #fbfdff, border-radius 12px, padding 14px
 * - .ghost-btn: width 100%, height 45px
 */
function InfoPanel({ caseInfo, onOpenCase }: InfoPanelProps): JSX.Element {
  if (!caseInfo) {
    return (
      <div className="info-panel">
        <div className="info-placeholder">Select a thread to view details</div>
      </div>
    );
  }

  return (
    <div className="info-panel">
      {/* Panel title */}
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
          Thông tin hồ sơ
        </div>
      </div>

      {/* Info boxes */}
      <div className="info-box">
        <strong>Mã hồ sơ</strong>
        <span>{caseInfo.caseCode}</span>
      </div>

      <div className="info-box">
        <strong>SLA còn lại</strong>
        <span>{caseInfo.slaRemaining} · {caseInfo.slaDetail}</span>
      </div>

      <div className="info-box">
        <strong>Tài liệu liên quan</strong>
        <span>{caseInfo.documents}</span>
      </div>

      <div className="info-box">
        <strong>Người tham gia</strong>
        <span>{caseInfo.participants}</span>
      </div>

      {/* Detail button */}
      <button className="ghost-btn" onClick={onOpenCase}>
        Mở hồ sơ chi tiết
      </button>
    </div>
  );
}

export default InfoPanel;
