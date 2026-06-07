'use client';

import Link from 'next/link';
import { Card, Typography, Button, Flex } from 'antd';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', padding: '64px 16px', background: '#F8FAFC' }}>
      <Flex vertical align="center" justify="center" style={{ minHeight: 'calc(100vh - 128px)' }}>
        <Card style={{ maxWidth: 480, width: '100%', borderRadius: 16 }}>
          <Flex vertical gap={24}>
            <Flex vertical gap={8}>
              <Paragraph style={{ margin: 0, color: '#0F766E', fontSize: 14, fontWeight: 600 }}>
                Legal-as-a-Service
              </Paragraph>
              <Title level={2} style={{ margin: 0, color: '#0F172A' }}>
                Nền tảng quản trị pháp lý
              </Title>
              <Paragraph style={{ margin: 0, color: '#475569', fontSize: 16 }}>
                Truy cập khu vực admin để quản lý người dùng, workspace, hồ sơ yêu cầu và audit.
              </Paragraph>
            </Flex>
            <Link href="/admin/users" style={{ width: 'fit-content' }}>
              <Button type="primary" size="large">
                Vào quản trị người dùng
              </Button>
            </Link>
          </Flex>
        </Card>
      </Flex>
    </main>
  );
}
