'use client';

import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const { Title } = Typography;

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: '/intake',
    });

    if (error) {
      message.error('Email hoac mat khau khong dung');
      setLoading(false);
    } else {
      router.push('/intake');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F0F2F5' }}>
      <Card style={{ width: 420 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          GitNexus Legal
        </Title>
        <Form name="signin" layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Email la bat buoc' },
              { type: 'email', message: 'Email khong hop le' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Mat khau la bat buoc' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mat khau" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Dang nhap
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
