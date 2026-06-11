'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '../Badge';

export interface ResourceData {
  requestCount: number;
  vaultFileCount: number;
  invitedCount: number;
  lastRequestUpdate: string | null;
  lastVaultUpdate: string | null;
  lastInviteUpdate: string | null;
}

export interface ResourceTableProps {
  resources: ResourceData;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function ResourceTable({ resources }: ResourceTableProps): JSX.Element {
  const rows = [
    {
      name: 'Ho so phap ly',
      description: 'Requests trong workspace',
      count: `${resources.requestCount} ho so`,
      status: 'Healthy' as const,
      statusVariant: 'green' as const,
      date: resources.lastRequestUpdate,
      action: 'Mo →',
      href: '../cases',
    },
    {
      name: 'Tai lieu vault',
      description: 'Hop dong, NDA, phu luc',
      count: `${resources.vaultFileCount} tep`,
      status: 'Encrypted' as const,
      statusVariant: 'green' as const,
      date: resources.lastVaultUpdate,
      action: 'Mo →',
      href: '../documents',
    },
    {
      name: 'Loi moi thanh vien',
      description: 'Dang cho xac nhan email',
      count: `${resources.invitedCount} loi moi`,
      status: 'Pending' as const,
      statusVariant: 'orange' as const,
      date: resources.lastInviteUpdate,
      action: 'Gui lai →',
      href: '#',
    },
  ];

  return (
    <div className="table-card">
      {/* Table Header */}
      <div className="table-head">
        <div className="th">Tai nguyen</div>
        <div className="th">So luong</div>
        <div className="th">Trang thai</div>
        <div className="th">Cap nhat gan nhat</div>
        <div className="th">Thao tac</div>
      </div>

      {/* Table Rows */}
      {rows.map((row, index) => (
        <div key={index} className="table-row">
          <div className="td">
            <div className="stack">
              <strong>{row.name}</strong>
              <span>{row.description}</span>
            </div>
          </div>
          <div className="td">{row.count}</div>
          <div className="td">
            <Badge variant={row.statusVariant}>{row.status}</Badge>
          </div>
          <div className="td">{formatDate(row.date)}</div>
          <div className="td">
            {row.href.startsWith('#') ? (
              <span className="action-link">{row.action}</span>
            ) : (
              <Link href={row.href} className="action-link">
                {row.action}
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
