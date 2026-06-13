'use client';

import React from 'react';

export interface CaseInfo {
  caseCode?: string;
  slaRemaining?: string;
  slaDetail?: string;
  documents?: string;
  participants?: string;
  // Optional additional fields
  status?: string;
  assignedSpecialist?: string;
  createdAt?: string;
  matterType?: string;
}

export interface InfoPanelProps {
  caseInfo: CaseInfo;
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * InfoPanel component - Right panel showing case details
 * Matches template (D-18, D-19, D-20):
 * - .info-panel: width 320px, background white, border-left 1px solid #e2e8f0
 * - .case-info: padding 20px
 * - .case-code: font-size 13px, color #64748b
 * - .sla: font-size 15px, font-weight 600, color #0f172a
 */
function InfoPanel({ caseInfo, isOpen = true, onClose }: InfoPanelProps): React.ReactElement {
  if (!isOpen) return <></>;

  return (
    <div className="info-panel">
      <div className="info-header">
        <h3>{caseInfo.caseCode}</h3>
        {onClose && (
          <button className="info-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className="case-info">
        {/* SLA Status */}
        <div className="sla-section">
          <p className="case-code">Thời hạn SLA</p>
          <p className="sla">{caseInfo.slaRemaining}</p>
          <p className="sla-detail">{caseInfo.slaDetail}</p>
        </div>

        {/* Participants */}
        {caseInfo.participants && (
          <div className="participants-section">
            <p className="case-code">Người tham gia</p>
            <div className="participant">
              <span className="participant-avatar">👤</span>
              <span>{caseInfo.participants}</span>
            </div>
          </div>
        )}

        {/* Documents */}
        {caseInfo.documents && (
          <div className="documents-section">
            <p className="case-code">Tài liệu đính kèm</p>
            <div className="documents-list">
              {caseInfo.documents.split(',').map((doc, idx) => (
                <div key={idx} className="document-item">
                  📄 {doc.trim()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        {caseInfo.matterType && (
          <div className="matter-section">
            <p className="case-code">Loại yêu cầu</p>
            <p className="matter-type">{caseInfo.matterType}</p>
          </div>
        )}

        {caseInfo.createdAt && (
          <div className="created-section">
            <p className="case-code">Ngày tạo</p>
            <p className="created-date">{caseInfo.createdAt}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InfoPanel;
