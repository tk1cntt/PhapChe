'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/my-cases/Badge';
import { FormattedDate } from '@/components/shared/ui/FormattedDate';

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
const ROUTES = {
  cases: '../cases',
  documents: '../documents',
} as const;

// then in rows:
      href: ROUTES.cases,
  cases: '../cases',
  documents: '../documents',
} as const;

// then in rows:
      href: ROUTES.cases,
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
      {rows.map((row) => (
        <div key={row.href} className="table-row">
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
          <div className="td"><FormattedDate date={row.date} variant="datetime" /></div>
          <div className="td">
            {row.action === t('resend') ? (
              <button type="button" className="action-link" onClick={() => {/* TODO: implement resend */}}>
                {row.action}
              </button>
            ) : (
              <Link href={row.href} className="action-link">
                {row.action}
              </Link>
            )}
              </Link>
            )}
      ))}
    </div>
  );
}

export default ResourceTable;
