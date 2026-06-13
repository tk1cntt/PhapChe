'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Users, Settings } from 'lucide-react';
import '@/components/admin/workspace.css';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string | Date;
}

export default function AdminWorkspaceClient() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/workspaces');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch workspaces');
      }

      const data = await response.json();
      setWorkspaces(data.workspaces || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="workspace-client">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Workspace khách hàng</h1>
          <p className="subtitle">
            Mỗi SME có workspace riêng để hiển thị membership và giảm rủi ro lộ dữ liệu giữa tenant.
          </p>
        </div>
        <button className="create-btn">
          <Plus size={18} />
          Tạo workspace
        </button>
      </div>

      {/* Permission Card */}
      <div className="permission-card">
        <div className="permission-title">
          <Building2 size={22} />
          Ranh giới quyền truy cập
        </div>
        <p>
          Bạn không có quyền xem nội dung này. Nếu cần truy cập, hãy liên hệ quản trị viên.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="workspace-error-card">
          <div className="workspace-error-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <strong>Không thể tải dữ liệu workspaces</strong>
          </div>
          <p>{error}</p>
          <button onClick={fetchWorkspaces}>Thử lại</button>
        </div>
      )}

      {/* Workspace Table */}
      {!error && (
        <div className="workspace-table-card">
          {/* Table Header */}
          <div className="workspace-table-head">
            <div className="workspace-th">Tên workspace</div>
            <div className="workspace-th">Slug</div>
            <div className="workspace-th">Thành viên</div>
            <div className="workspace-th">Trạng thái</div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="workspace-loading">Đang tải...</div>
          )}

          {/* Empty State */}
          {!loading && workspaces.length === 0 && (
            <div className="workspace-empty">Chưa có workspace nào.</div>
          )}

          {/* Table Rows */}
          {!loading && workspaces.map((workspace) => (
            <div key={workspace.id} className="workspace-table-row">
              {/* Workspace Name */}
              <div className="workspace-td">
                <div className="workspace-name-cell">
                  <div className="workspace-icon">
                    <Building2 size={18} />
                  </div>
                  <span>{workspace.name}</span>
                </div>
              </div>

              {/* Slug */}
              <div className="workspace-td">
                <span className="workspace-slug">{workspace.slug}</span>
              </div>

              {/* Members */}
              <div className="workspace-td">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={16} color="#64748b" />
                  <span className="workspace-members">
                    {workspace.memberCount} thành viên
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="workspace-td">
                <span className={`status-badge ${!workspace.isActive ? 'inactive' : ''}`}>
                  {workspace.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Action */}
      {!error && (
        <div className="workspace-footer">
          <button className="create-btn blue">
            <Plus size={18} />
            Tạo workspace
          </button>
        </div>
      )}
    </div>
  );
}
