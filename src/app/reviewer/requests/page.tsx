'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tag, Card, Typography, Flex, Spin } from 'antd';
import ReviewerRequestsTable from './ReviewerRequestsTable';
import type { ReviewerRequestRow } from './ReviewerRequestsTable';

export default function ReviewerQueuePage() {
  const searchParams = useSearchParams();
  const notice = searchParams.get('notice');
  const [rows, setRows] = useState<ReviewerRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviewer/requests')
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Flex vertical gap="middle">
      {notice === 'approved' ? (
        <Tag color="cyan">Da duyet tai lieu. Tai lieu da duoc chuyen sang trang thai cuoi.</Tag>
      ) : notice === 'revision' ? (
        <Tag color="red">Da gui yeu cau chinh sua cho chuyen vien.</Tag>
      ) : null}

      <Flex vertical>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Hang cho duyet
        </Typography.Title>
        <Typography.Paragraph style={{ margin: 0, color: '#475569' }}>
          Danh sach phien ban tai lieu duoc chuyen vien gui len cho ban duyet.
        </Typography.Paragraph>
      </Flex>

      <Card>
        <Typography.Title level={5}>Hang cho duyet</Typography.Title>
        <Typography.Paragraph style={{ color: '#475569' }}>
          Danh sach nay duoc loc theo reviewer dang dang nhap.
        </Typography.Paragraph>
      </Card>

      {loading ? (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin />
        </Flex>
      ) : (
        <ReviewerRequestsTable rows={rows} notice={notice ?? undefined} />
      )}
    </Flex>
  );
}
