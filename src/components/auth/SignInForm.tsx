'use client';

import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const { Title } = Typography;

// Default demo credentials (from seed data)
const DEFAULT_EMAIL = 'customer.demo@example.test';
const DEFAULT_PASSWORD = 'Demo@123456';

export function SignInForm() {
  const t = useTranslations('Auth');
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
        message.error(t('invalidCredentials'));
      } else {
        // Redirect to returnUrl if present, otherwise to dashboard
        const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/vi/dashboard';
        router.push(redirectTo);
      }
    } catch (e) {
      message.error(t('genericError'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F0F2F5' }}>
      <Card style={{ width: 420 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          {t('appName')}
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
              { required: true, message: t('emailRequired') },
              { type: 'email', message: t('emailInvalid') },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder={t('email')} size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: t('passwordRequired') }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('password')} size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {t('signIn')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
