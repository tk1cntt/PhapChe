'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Result, Spin, Space, Tag, Divider, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, HomeOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';

interface InviteInfo {
  id: string;
  email: string;
  role: 'admin' | 'specialist' | 'viewer';
  partnerName?: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin - Quản trị viên',
  specialist: 'Specialist - Chuyên viên',
  viewer: 'Viewer - Người xem',
};

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = params.token as string;

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ');
      setLoading(false);
      return;
    }

    // For now, just show the accept UI - the API will validate
    setInviteInfo({
      id: token,
      email: 'invited@example.com',
      role: 'specialist',
      partnerName: 'Đối tác Pháp Chế',
    });
    setLoading(false);
  }, [token]);

  const handleAccept = async () => {
    if (status !== 'authenticated') {
      // Redirect to login with return URL
      router.push(`/login?callbackUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/partner/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể chấp nhận lời mời');
      }

      setAccepted(true);
      message.success('Chào mừng bạn gia nhập đội ngũ!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Chào mừng bạn!"
            subTitle="Bạn đã trở thành thành viên của đội ngũ. Hãy bắt đầu công việc."
            extra={[
              <Button type="primary" key="dashboard" onClick={() => router.push('/dashboard')}>
                Đi đến Dashboard
              </Button>,
              <Button key="home" icon={<HomeOutlined />} onClick={() => router.push('/')}>
                Trang chủ
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <Result
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Không thể chấp nhận lời mời"
            subTitle={error}
            extra={[
              <Button type="primary" key="home" onClick={() => router.push('/')}>
                Đi đến trang chủ
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Lời mời tham gia</h1>
          <p className="text-gray-500">Bạn đã được mời tham gia một đội ngũ</p>
        </div>

        <Divider />

        <div className="space-y-4 mb-6">
          {inviteInfo?.partnerName && (
            <div>
              <div className="text-gray-500 text-sm mb-1">Tổ chức</div>
              <div className="font-medium text-lg">{inviteInfo.partnerName}</div>
            </div>
          )}

          <div>
            <div className="text-gray-500 text-sm mb-1">Vai trò được mời</div>
            <Tag color="blue" className="text-base px-3 py-1">
              {roleLabels[inviteInfo?.role || 'specialist']}
            </Tag>
          </div>

          <div>
            <div className="text-gray-500 text-sm mb-1">Quyền hạn</div>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {inviteInfo?.role === 'admin' && (
                <>
                  <li>Quản lý thành viên</li>
                  <li>Quản lý yêu cầu</li>
                  <li>Quản lý tài liệu</li>
                </>
              )}
              {inviteInfo?.role === 'specialist' && (
                <>
                  <li>Xem và quản lý yêu cầu</li>
                  <li>Xem và quản lý tài liệu</li>
                </>
              )}
              {inviteInfo?.role === 'viewer' && (
                <>
                  <li>Chỉ xem yêu cầu</li>
                  <li>Chỉ xem tài liệu</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <Divider />

        {status === 'unauthenticated' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">
              Bạn cần đăng nhập để chấp nhận lời mời này.
            </p>
          </div>
        )}

        <Space className="w-full justify-center">
          <Button size="large" onClick={handleDecline}>
            Từ chối
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleAccept}
            loading={accepting}
          >
            {status === 'unauthenticated' ? 'Đăng nhập và chấp nhận' : 'Chấp nhận lời mời'}
          </Button>
        </Space>
      </Card>
    </div>
  );
}
