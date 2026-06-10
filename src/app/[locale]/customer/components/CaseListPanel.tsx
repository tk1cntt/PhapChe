'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from './Badge';

interface Case {
  id: string;
  code: string;
  title: string;
  specialistName: string;
  specialistRole: string;
  status: 'review' | 'pending' | 'approved';
}

export interface CaseListPanelProps {
  cases: Case[];
}

function getStatusVariant(status: Case['status']): BadgeProps['variant'] {
  switch (status) {
    case 'review':
      return 'blue';
    case 'pending':
      return 'orange';
    case 'approved':
      return 'green';
    default:
      return 'blue';
  }
}

function getStatusLabel(status: Case['status']): string {
  switch (status) {
    case 'review':
      return 'Đang xem';
    case 'pending':
      return 'Chờ duyệt';
    case 'approved':
      return 'Đã duyệt';
    default:
      return status;
  }
}

type BadgeProps = {
  variant: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
};

export function CaseListPanel({ cases }: CaseListPanelProps): JSX.Element {
  return (
    <div className="panel">
      <div className="panel-title">Hồ sơ đang xử lý</div>
      <div className="case-list">
        {cases.length === 0 ? (
          <div className="empty-state">Không có hồ sơ nào đang xử lý</div>
        ) : (
          cases.map((item) => (
            <div key={item.id} className="case-item">
              <div className="case-main">
                <div className="case-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="case-info">
                  <strong>{item.code}</strong>
                  <span>{item.title}</span>
                </div>
              </div>
              <div className="stack">
                <strong>{item.specialistName}</strong>
                <span>{item.specialistRole}</span>
              </div>
              <Badge variant={getStatusVariant(item.status)}>
                {getStatusLabel(item.status)}
              </Badge>
              <Link href={`/customer/cases/${item.id}`} className="action-link">
                Mở <span>→</span>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
