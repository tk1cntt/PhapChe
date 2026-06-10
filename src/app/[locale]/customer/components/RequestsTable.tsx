'use client';

import React from 'react';
import { Badge } from './Badge';

export interface RequestRow {
  id: string;
  code: string;
  statusText: string;
  type: string;
  typeEn: string;
  specialistName: string;
  specialistRole: string;
  updatedDate: string;
  updatedTime: string;
  status: 'review' | 'pending' | 'approved' | 'overdue';
  actionText: string;
}

export interface RequestsTableProps {
  requests: RequestRow[];
}

function getStatusVariant(status: RequestRow['status']): BadgeProps['variant'] {
  switch (status) {
    case 'review':
      return 'blue';
    case 'pending':
      return 'orange';
    case 'approved':
      return 'green';
    case 'overdue':
      return 'red';
    default:
      return 'blue';
  }
}

type BadgeProps = {
  variant: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
};

export function RequestsTable({ requests }: RequestsTableProps): JSX.Element {
  return (
    <div className="table-card">
      <div className="table-head">
        <div className="th">Mã hồ sơ</div>
        <div className="th">Loại yêu cầu</div>
        <div className="th">Trạng thái</div>
        <div className="th">Người phụ trách</div>
        <div className="th">Cập nhật gần nhất</div>
        <div className="th">Thao tác</div>
      </div>
      {requests.length === 0 ? (
        <div className="table-empty">Không có hồ sơ nào</div>
      ) : (
        requests.map((item) => (
          <div key={item.id} className="table-row">
            <div className="td">
              <div className="case-main">
                <div className="case-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="case-info">
                  <strong>{item.code}</strong>
                  <span>{item.statusText}</span>
                </div>
              </div>
            </div>
            <div className="td">
              <div className="stack">
                <strong>{item.type}</strong>
                <span>{item.typeEn}</span>
              </div>
            </div>
            <div className="td">
              <Badge variant={getStatusVariant(item.status)}>
                {item.statusText}
              </Badge>
            </div>
            <div className="td">
              <div className="stack">
                <strong>{item.specialistName}</strong>
                <span>{item.specialistRole}</span>
              </div>
            </div>
            <div className="td">
              <div className="stack">
                <strong>{item.updatedDate}</strong>
                <span>{item.updatedTime}</span>
              </div>
            </div>
            <div className="td">
              <a href={`/customer/cases/${item.id}`} className="action-link">
                {item.actionText}
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default RequestsTable;
