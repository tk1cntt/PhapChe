'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Flex, Spin } from 'antd';
import SpecialistRequestsTable from './SpecialistRequestsTable';
import type { SpecialistRequestRow } from './SpecialistRequestsTable';

const { Title, Paragraph } = Typography;

export default function SpecialistRequestsPage() {
  const [rows, setRows] = useState<SpecialistRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/specialist/requests')
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Flex vertical gap={8} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Yêu cầu được giao</Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Danh sách yêu cầu đã được điều phối cho bạn.
        </Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 4 }}>Hàng chờ xử lý</Title>
        <Paragraph style={{ color: '#475569', marginBottom: 0 }}>
          Danh sách này được lọc theo workspace hiện tại và chuyên viên đang đăng nhập.
        </Paragraph>
      </Card>

      {loading ? (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin />
        </Flex>
      ) : (
        <SpecialistRequestsTable rows={rows} />
      )}
    </>
  );
}
