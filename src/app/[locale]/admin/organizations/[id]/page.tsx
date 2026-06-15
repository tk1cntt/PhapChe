'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, Building, Users, FileText, Vault } from 'lucide-react';
import './organization-detail.css';

interface Organization {
  id: string;
  name: string;
  tenantId: string;
  tenant?: { id: string; name: string };
  businessType: string | null;
  registrationNumber: string | null;
  address: string | null;
  contactEmail: string | null;
  status: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  workspaces?: { id: string; name: string; slug: string }[];
  _count?: {
    workspaces: number;
    requests?: number;
    members?: number;
  };
}

interface ApiResponse {
  data: Organization;
}

export default function AdminOrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('AdminOrganizations');
  const tCommon = useTranslations('Common');

  const organizationId = params.id as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    businessType: '',
    contactEmail: '',
    address: '',
    status: 'active',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/sign-in');
          return;
        }
        if (response.status === 404) {
          setError('Organization not found');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch organization');
      }

      const data: ApiResponse = await response.json();
      setOrganization(data.data);
      setFormData({
        name: data.data.name,
        registrationNumber: data.data.registrationNumber || '',
        businessType: data.data.businessType || '',
        contactEmail: data.data.contactEmail || '',
        address: data.data.address || '',
        status: data.data.status,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organization';
      setError(errorMessage);
      console.error('Error fetching organization:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          registrationNumber: formData.registrationNumber,
          businessType: formData.businessType || undefined,
          contactEmail: formData.contactEmail || undefined,
          address: formData.address || undefined,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update organization');
      }

      setIsEditing(false);
      fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete organization');
      }

      const locale = window.location.pathname.split('/')[1] || 'vi';
      router.push(`/${locale}/admin/organizations`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete organization';
      setError(errorMessage);
    }
  };

  const handleCreateWorkspace = () => {
    const locale = window.location.pathname.split('/')[1] || 'vi';
    router.push(`/${locale}/admin/workspaces/new?organizationId=${organizationId}`);
  };

  if (loading) {
    return (
      <div className="content">
        <div className="organization-detail">
          <div className="detail-loading">
            <div className="loading-text">{tCommon('loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="organization-detail">
          <div className="detail-error">
            <div className="error-icon">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="error-title">{tCommon('error')}</div>
            <div className="error-message">{error}</div>
            <button onClick={() => fetchData()} className="btn-retry">
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="content">
      <div className="organization-detail">
        {/* Back Link */}
        <button
          onClick={() => {
            const locale = window.location.pathname.split('/')[1] || 'vi';
            router.push(`/${locale}/admin/organizations`);
          }}
          className="back-link"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('back')}
        </button>

        {/* Hero Section */}
        <div className="detail-hero">
          <div className="detail-hero-inner">
            <div className="org-info">
              <div className="org-avatar">
                <Building2 size={34} strokeWidth={1.5} />
              </div>
              <div className="org-details">
                <div className="org-kicker">Organization profile</div>
                <h1>{organization.name}</h1>
                <div className="org-meta">
                  <span className="status-badge">
                    <span className="status-dot" />
                    {organization.status === 'active' ? 'Active' : organization.status === 'inactive' ? 'Inactive' : 'Pending'}
                  </span>
                  {organization.businessType && (
                    <span className="org-chip">{organization.businessType}</span>
                  )}
                  {organization.registrationNumber && (
                    <span className="org-chip">MST: {organization.registrationNumber}</span>
                  )}
                  {organization.address && (
                    <span className="org-chip">{organization.address.split(',').pop()?.trim()}</span>
                  )}
                </div>
              </div>
            </div>

            {!organization.isDefault && (
              <div className="detail-actions">
                {!isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(true)} className="btn-edit">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('edit')}
                    </button>
                    <button onClick={handleDelete} className="btn-delete">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('delete')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: organization.name,
                          registrationNumber: organization.registrationNumber || '',
                          businessType: organization.businessType || '',
                          contactEmail: organization.contactEmail || '',
                          address: organization.address || '',
                          status: organization.status,
                        });
                      }}
                      className="btn-edit"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-save"
                      style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.28)' }}
                    >
                      {saving ? tCommon('saving') : t('save')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hero Stats Row */}
          <div className="hero-stat-row">
            <div className="hero-stat">
              <span>Workspaces</span>
              <strong>{organization._count?.workspaces || 0}</strong>
            </div>
            <div className="hero-stat">
              <span>Legal Requests</span>
              <strong>{organization._count?.requests || 0}</strong>
            </div>
            <div className="hero-stat">
              <span>Vault Files</span>
              <strong>0</strong>
            </div>
            <div className="hero-stat">
              <span>Status</span>
              <strong>{organization.status === 'active' ? 'Active' : organization.status === 'inactive' ? 'Inactive' : 'Pending'}</strong>
            </div>
          </div>
        </div>

        {/* Detail Layout */}
        <div className="detail-layout">
          {/* Main Content */}
          <div className="detail-main">
            {/* Organization Info Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div>
                  <h2>{t('organizationInfo')}</h2>
                  <div className="card-subtitle">Thông tin pháp lý và liên hệ chính của tổ chức.</div>
                </div>
                <div className="card-icon">
                  <Building size={21} />
                </div>
              </div>
              <div className="detail-card-body">
                {isEditing ? (
                  <div className="edit-form">
                    <div className="form-field">
                      <label>{t('formName')} *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>{t('formBusinessType')}</label>
                      <input
                        type="text"
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        placeholder={t('formBusinessTypePlaceholder')}
                      />
                    </div>
                    <div className="form-field">
                      <label>{t('formRegistrationNumber')}</label>
                      <input
                        type="text"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        placeholder={t('formRegistrationNumberPlaceholder')}
                      />
                    </div>
                    <div className="form-field">
                      <label>{t('formContactEmail')}</label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder={t('formContactEmailPlaceholder')}
                      />
                    </div>
                    <div className="form-field">
                      <label>{t('formAddress')}</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder={t('formAddressPlaceholder')}
                      />
                    </div>
                    <div className="form-field">
                      <label>{t('formStatus')}</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="active">{t('statusActive')}</option>
                        <option value="inactive">{t('statusInactive')}</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: organization.name,
                            registrationNumber: organization.registrationNumber || '',
                            businessType: organization.businessType || '',
                            contactEmail: organization.contactEmail || '',
                            address: organization.address || '',
                            status: organization.status,
                          });
                        }}
                        className="btn-cancel"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-save"
                      >
                        {saving ? tCommon('saving') : t('save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Tên tổ chức</div>
                      <div className="info-value">{organization.name}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Loại hình doanh nghiệp</div>
                      <div className="info-value">{organization.businessType || '—'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Email liên hệ</div>
                      <div className="info-value">{organization.contactEmail || '—'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Mã số ĐKKD</div>
                      <div className="info-value">{organization.registrationNumber || '—'}</div>
                    </div>
                    <div className="info-item full-width">
                      <div className="info-label">Địa chỉ</div>
                      <div className="info-value">{organization.address || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Operation Notes Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div>
                  <h2>{t('operationNotes') || 'Ghi chú vận hành'}</h2>
                  <div className="card-subtitle">Dùng để theo dõi ngữ cảnh khách hàng trong quá trình tạo workspace và hồ sơ.</div>
                </div>
                <div className="card-icon">
                  <FileText size={21} />
                </div>
              </div>
              <div className="detail-card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Ngành nghề</div>
                    <div className="info-value">{organization.businessType || '—'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Rủi ro thường gặp</div>
                    <div className="info-value">—</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar-detail">
            {/* Stats Panel */}
            <div className="detail-card stat-panel">
              <div className="detail-card-header" style={{ padding: '0 0 18px', borderBottom: 'none' }}>
                <div>
                  <h2>{t('statistics') || 'Thống kê'}</h2>
                  <div className="card-subtitle">Tổng quan tài nguyên liên quan.</div>
                </div>
              </div>
              <div className="stat-list">
                <div className="stat-item">
                  <div className="stat-label">workspaces</div>
                  <div className="stat-value">{organization._count?.workspaces || 0}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">requests</div>
                  <div className="stat-value">{organization._count?.requests || 0}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">members</div>
                  <div className="stat-value">{organization._count?.members || 0}</div>
                </div>
              </div>
            </div>

            {/* System Info Panel */}
            <div className="detail-card stat-panel">
              <div className="detail-card-header" style={{ padding: '0 0 18px', borderBottom: 'none' }}>
                <div>
                  <h2>{t('systemInfo') || 'Thông tin hệ thống'}</h2>
                  <div className="card-subtitle">Metadata phục vụ audit và quản trị.</div>
                </div>
              </div>
              <div className="metadata-list">
                <div className="metadata-item">
                  <div className="metadata-label">{t('createdAt') || 'Ngày tạo'}</div>
                  <div className="metadata-value">{new Date(organization.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="metadata-item">
                  <div className="metadata-label">{t('updatedAt') || 'Cập nhật lần cuối'}</div>
                  <div className="metadata-value">{new Date(organization.updatedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="metadata-item">
                  <div className="metadata-label">Identifier</div>
                  <div className="metadata-value">{organization.id}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="detail-card stat-panel">
              <div className="detail-card-header" style={{ padding: '0 0 18px', borderBottom: 'none' }}>
                <div>
                  <h2>{t('quickActions') || 'Thao tác nhanh'}</h2>
                  <div className="card-subtitle">Các hành động thường dùng.</div>
                </div>
              </div>
              <div className="quick-actions">
                <button className="quick-action primary" onClick={handleCreateWorkspace}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('createWorkspace') || 'Tạo workspace'}
                </button>
                <button className="quick-action" onClick={() => {
                  const locale = window.location.pathname.split('/')[1] || 'vi';
                  router.push(`/${locale}/admin/requests/new?organizationId=${organizationId}`);
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('createRequest') || 'Tạo hồ sơ pháp lý'}
                </button>
                <button className="quick-action" onClick={() => {
                  const locale = window.location.pathname.split('/')[1] || 'vi';
                  router.push(`/${locale}/admin/audit?organizationId=${organizationId}`);
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t('viewAuditLog') || 'Xem audit log'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
