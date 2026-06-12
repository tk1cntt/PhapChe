'use client';

import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const { Title } = Typography;

// Default demo credentials (from seed data)
const DEFAULT_EMAIL = 'customer.demo@example.test';
const DEFAULT_PASSWORD = 'Demo@123456';

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get returnUrl from query params
  const returnUrl = searchParams.get('returnUrl');

  // Pre-fill default credentials on mount
  useEffect(() => {
    form.setFieldsValue({
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
    });
  }, [form]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        message.error('Email hoặc mật khẩu không đúng');
      } else {
        // Redirect to returnUrl if present, otherwise to dashboard
        const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/vi/dashboard';
        router.push(redirectTo);
      }
    } catch (e) {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F0F2F5' }}>
      <Card style={{ width: 420 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          GitNexus Legal
        </Title>
        <Form
          form={form}
          name="signin"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            email: DEFAULT_EMAIL,
            password: DEFAULT_PASSWORD,
          }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Email là bắt buộc' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Mật khẩu là bắt buộc' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
