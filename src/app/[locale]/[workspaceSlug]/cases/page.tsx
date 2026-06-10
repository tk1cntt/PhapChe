'use client';

import React, { useState, useCallback, useMemo } from 'react';
import UserLayout from '@/app/[locale]/customer/components/UserLayout';
import SummaryBanner from '@/app/[locale]/customer/components/SummaryBanner';
import StatCard from '@/app/[locale]/customer/components/StatCard';
import FloatingChatButton from '@/app/[locale]/customer/components/FloatingChatButton';
import '@/app/[locale]/customer/components/dashboard.css';

// Sample data matching template
const SAMPLE_REQUESTS = [
  {
    id: 'req-021',
    code: 'REQ-2026-021',
    statusText: 'Đang xử lý',
    type: 'Rà soát hợp đồng dịch vụ',
    typeEn: 'Contract Review',
    statusBadge: 'review' as const,
    specialistName: 'Hà Linh',
    specialistRole: 'Specialist',
    updatedDate: '10/06/2026',
    updatedTime: '21:15 ICT',
    slaText: 'Còn 5h',
    slaVariant: 'orange' as const,
    actionText: 'Mở',
    actionHref: '/customer/cases/req-021',
  },
  {
    id: 'req-019',
    code: 'REQ-2026-019',
    statusText: 'Cần phản hồi',
    type: 'Soạn phụ lục SLA',
    typeEn: 'Legal Amendment',
    statusBadge: 'pending' as const,
    specialistName: 'Quang Dũng',
    specialistRole: 'Reviewer',
    updatedDate: '10/06/2026',
    updatedTime: '20:48 ICT',
    slaText: 'Còn 2h',
    slaVariant: 'red' as const,
    actionText: 'Phản hồi',
    actionHref: '/customer/cases/req-019',
  },
  {
    id: 'req-018',
    code: 'REQ-2026-018',
    statusText: 'Hoàn tất',
    type: 'Tư vấn điều khoản bảo mật',
    typeEn: 'NDA Advisory',
    statusBadge: 'approved' as const,
    specialistName: 'Minh Trang',
    specialistRole: 'Coordinator',
    updatedDate: '09/06/2026',
    updatedTime: '16:32 ICT',
    slaText: 'Đúng hạn',
    slaVariant: 'green' as const,
    actionText: 'Tải kết quả',
    actionHref: '/customer/cases/req-018',
  },
  {
    id: 'req-016',
    code: 'REQ-2026-016',
    statusText: 'Thiếu tài liệu',
    type: 'Bổ sung giấy phép kinh doanh',
    typeEn: 'Document Request',
    statusBadge: 'overdue' as const,
    specialistName: 'Hà Linh',
    specialistRole: 'Specialist',
    updatedDate: '08/06/2026',
    updatedTime: '09:10 ICT',
    slaText: 'Trễ 1 ngày',
    slaVariant: 'red' as const,
    actionText: 'Bổ sung',
    actionHref: '/customer/cases/req-016',
  },
  {
    id: 'req-012',
    code: 'REQ-2026-012',
    statusText: 'Hoàn tất',
    type: 'Đăng ký nhãn hiệu',
    typeEn: 'IP Filing',
    statusBadge: 'submitted' as const,
    specialistName: 'Khánh An',
    specialistRole: 'IP Specialist',
    updatedDate: '28/05/2026',
    updatedTime: '14:20 ICT',
    slaText: 'Theo dõi',
    slaVariant: 'blue' as const,
    actionText: 'Xem',
    actionHref: '/customer/cases/req-012',
  },
];

// Stats data (from database in real implementation)
const STATS = {
  total: 12,
  processing: 3,
  completed: 8,
  overdue: 1,
};

interface MyCasesClientProps {
  userName: string;
  workspaceName: string;
  workspaceSlug: string;
}

export function MyCasesClient({ userName, workspaceName, workspaceSlug }: MyCasesClientProps) {
  const [searchQuery] = useState('');

  return (
    <>
      <SummaryBanner
        title="Danh sách hồ sơ pháp lý của bạn"
        description={`Theo dõi trạng thái xử lý, người phụ trách, SLA và kết quả tư vấn trong phạm vi workspace ${workspaceName}.`}
        buttonText="Tạo yêu cầu mới"
        workspaceSlug={workspaceSlug}
      />

      <div className="stats">
        <StatCard title="Tổng hồ sơ" value={STATS.total} description="Từ tháng 01/2026" icon="file" variant="blue" />
        <StatCard title="Đang xử lý" value={STATS.processing} description="Có 1 hồ sơ cần phản hồi" icon="clock" variant="orange" />
        <StatCard title="Hoàn tất" value={STATS.completed} description="Đã có kết quả tư vấn" icon="check" variant="green" />
        <StatCard title="Quá hạn" value={STATS.overdue} description="Thiếu tài liệu bổ sung" icon="alert" variant="red" />
      </div>

      {/* Placeholder for toolbar and table - will be added in Plan 02 */}
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '15px', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <p style={{ color: 'var(--muted)' }}>Toolbar and table will be added in next phase</p>
      </div>

      <FloatingChatButton notificationCount={2} notificationText="Tin mới" />
    </>
  );
}

// Server component
export default async function MyCasesPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const workspaceSlug = params.workspaceSlug;
  const userName = 'Mai Phương';
  const workspaceName = 'Công ty An Phát';

  return (
    <UserLayout
      userName={userName}
      userRole="Customer"
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
    >
      <div className="page-header">
        <div>
          <h1>Hồ sơ của tôi</h1>
          <p className="subtitle">
            Quản lý các yêu cầu pháp lý, trạng thái xử lý, SLA và kết quả tư vấn của bạn.
          </p>
        </div>
      </div>

      <MyCasesClient
        userName={userName}
        workspaceName={workspaceName}
        workspaceSlug={workspaceSlug}
      />
    </UserLayout>
  );
}
