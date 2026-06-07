'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Flex, Spin } from 'antd';
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
          Điều phối yêu cầu pháp lý
        </Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Xem yêu cầu đã gửi hoặc cần triage, kiểm tra gợi ý phù hợp và phân công người xử lý.
        </Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>Hàng chờ điều phối</Title>
        {data?.requests.length === 0 ? (
          <div style={{ padding: 24, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <Title level={5}>Chưa có yêu cầu cần điều phối</Title>
            <Paragraph type="secondary">Khi khách hàng gửi yêu cầu mới hoặc yêu cầu cần triage, hồ sơ sẽ xuất hiện tại đây để điều phối viên phân công.</Paragraph>
          </div>
        ) : (
          <RoutingRequestsTable requests={data?.requests ?? []} suggestionRows={data?.suggestionRows ?? []} />
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>Loại vụ việc</Title>
        <RoutingMatterTypesTable matterTypes={data?.matterTypes ?? []} />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>Năng lực xử lý</Title>
        <RoutingCapabilitiesTable capabilities={data?.capabilities ?? []} />
      </Card>
    </>
  );
}
