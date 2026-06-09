'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Flex, Row, Col, Spin } from 'antd';
import { VaultFilesTable } from './VaultFilesTable';
import { useTranslations } from 'next-intl';

const { Title, Paragraph } = Typography;

interface VaultData {
  folders: any[];
  tags: any[];
  classifications: any[];
}

export default function VaultPageClient() {
  const t = useTranslations('Vault');
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vault')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  const { folders, tags, classifications } = data;

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

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card>
            <Title level={5}>{t('folders')}</Title>
            {folders.length === 0 ? (
              <p style={{ color: '#64748B', textAlign: 'center', padding: 24 }}>
                {t('noFolders')}
              </p>
            ) : (
              <ul>
                {folders.map((f: any) => (
                  <li key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                    <strong>{f.name}</strong> ({f._count?.vaultFileFolders || 0} {t('fileCount')})
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card>
            <Title level={5}>{t('tags')}</Title>
            {tags.length === 0 ? (
              <p style={{ color: '#64748B', textAlign: 'center', padding: 24 }}>
                {t('noTags')}
              </p>
            ) : (
              <ul>
                {tags.map((t: any) => (
                  <li key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                    <strong>{t.label}</strong> ({t._count?.vaultFileTags || 0} {t('fileCount')})
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
      </Row>

      <Card>
        <Title level={5}>{t('files')}</Title>
        {classifications.length === 0 ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: 24 }}>
            {t('noFiles')}
          </p>
        ) : (
          <VaultFilesTable
            classifications={classifications}
            folders={folders.map((f: any) => ({ id: f.id, name: f.name }))}
            tags={tags.map((t: any) => ({ id: t.id, key: t.key, label: t.label }))}
          />
        )}
      </Card>
    </>
  );
}
