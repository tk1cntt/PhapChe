'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Flex, Spin } from 'antd';
import { useTranslations } from 'next-intl';
import { RoutingRequestsTable, RoutingMatterTypesTable, RoutingCapabilitiesTable } from './AdminRoutingTables';

const { Title, Paragraph } = Typography;

interface RoutingData {
  requests: any[];
  matterTypes: any[];
  capabilities: any[];
  members: any[];
  suggestionRows: any[];
}

export default function RoutingPageClient() {
  const t = useTranslations('AdminRouting');
  const [data, setData] = useState<RoutingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/routing')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          {t('pageTitle')}
        </Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          {t('pageDescription')}
        </Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>{t('routingQueue')}</Title>
        {data?.requests.length === 0 ? (
          <div style={{ padding: 24, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <Title level={5}>{t('noRoutingTitle')}</Title>
            <Paragraph type="secondary">{t('noRoutingDesc')}</Paragraph>
          </div>
        ) : (
          <RoutingRequestsTable requests={data?.requests ?? []} suggestionRows={data?.suggestionRows ?? []} />
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>{t('matterTypes')}</Title>
        <RoutingMatterTypesTable matterTypes={data?.matterTypes ?? []} />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>{t('processingCapacity')}</Title>
        <RoutingCapabilitiesTable capabilities={data?.capabilities ?? []} />
      </Card>
    </>
  );
}
