'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Typography, Flex } from 'antd';
import { useTranslations } from 'next-intl';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import AdminTemplatesTable from './AdminTemplatesTable';

const { Title, Paragraph } = Typography;

export default function TemplatesPageClient() {
  const t = useTranslations('AdminTemplates');
  const tMatter = useTranslations('MatterTypes');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <CardSkeleton count={3} />;
  }

  // Group by matterTypeKey
  const grouped = new Map<string, typeof templates>();
  for (const t of templates) {
    if (!grouped.has(t.matterTypeKey)) grouped.set(t.matterTypeKey, []);
    grouped.get(t.matterTypeKey)!.push(t);
  }

  const getMatterTypeLabel = (key: string) => {
    const labelMap: Record<string, string> = {
      labor_contract: tMatter('laborContract'),
      agency_contract: tMatter('agencyContract'),
      trademark_registration: tMatter('trademarkRegistration'),
      unsupported: tMatter('other'),
    };
    return labelMap[key] ?? key;
  };

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="flex-start">
          <Flex vertical>
            <Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
              {t('pageTitle')}
            </Title>
            <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
              {t('pageDescription')}
            </Paragraph>
          </Flex>
          <Link href="/admin/templates/new">
            <Button type="primary">{t('createButton')}</Button>
          </Link>
        </Flex>
      </Flex>

      {templates.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 14 }}>
            {t('emptyState')}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...grouped.entries()].map(([matterTypeKey, items]) => {
            const label = getMatterTypeLabel(matterTypeKey);
            return (
              <div key={matterTypeKey}>
                <h2 style={{ marginBottom: 8, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>
                  {label}
                </h2>
                <AdminTemplatesTable items={items} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
