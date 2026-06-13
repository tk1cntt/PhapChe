'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/my-cases/Badge';

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
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function ResourceTable({ resources }: ResourceTableProps): React.ReactElement {
  const t = useTranslations('UserWorkspace');

  const rows = [
    {
      name: t('legalRequests'),
      description: t('legalRequestsDesc'),
      count: t('countRequests', { count: resources.requestCount }),
      status: t('statusHealthy'),
      statusVariant: 'green' as const,
      date: resources.lastRequestUpdate,
      action: t('open'),
      href: '../cases',
    },
    {
      name: t('vaultDocs'),
      description: t('vaultDocsDesc'),
      count: t('countFiles', { count: resources.vaultFileCount }),
      status: t('statusEncrypted'),
      statusVariant: 'green' as const,
      date: resources.lastVaultUpdate,
      action: t('open'),
      href: '../documents',
    },
    {
      name: t('memberInvites'),
      description: t('memberInvitesDesc'),
      count: t('countInvites', { count: resources.invitedCount }),
      status: t('statusPending'),
      statusVariant: 'orange' as const,
      date: resources.lastInviteUpdate,
      action: t('resend'),
      href: '#',
    },
  ];

  return (
    <div className="table-card">
      {/* Table Header */}
      <div className="table-head">
        <div className="th">{t('resourcesTitle')}</div>
        <div className="th">{t('resourceCount')}</div>
        <div className="th">{t('resourceStatus')}</div>
        <div className="th">{t('resourceUpdate')}</div>
        <div className="th">{t('action')}</div>
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

export default ResourceTable;
