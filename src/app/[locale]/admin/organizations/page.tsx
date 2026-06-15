'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Building2 } from 'lucide-react';
import { AdminStatGrid } from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import Paging from '@/components/ui/Paging';
import './organizations.css';

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
  _count?: {
    workspaces: number;
  };
}

interface ApiResponse {
  data: Organization[];
  pagination: {
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
  };
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

const badgeStyles: Record<string, { bg: string; color: string; dot: string }> = {
  active: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  inactive: { bg: '#f1f5f9', color: '#64748b', dot: '#64748b' },
  pending: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
};

function StatusBadge({ status }: { status: string }) {
  const style = badgeStyles[status] || badgeStyles.inactive;
  const labels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
  };
  return (
    <span
      className="status-badge"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      <span className="status-dot" style={{ background: style.dot }} />
      {labels[status] || status}
    </span>
  );
}

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const t = useTranslations('AdminOrganizations');
  const tCommon = useTranslations('Common');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    registrationNumber: '',
    address: '',
    contactEmail: '',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        skip: ((page - 1) * take).toString(),
        take: take.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const response = await fetch(`/api/admin/organizations?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/sign-in');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch organizations');
      }

      const data: ApiResponse = await response.json();
      setOrganizations(data.data);
      setTotal(data.pagination.total);

      // Calculate stats
      const statsCalc: Stats = {
        total: data.pagination.total,
        active: data.data.filter(o => o.status === 'active').length,
        inactive: data.data.filter(o => o.status === 'inactive').length,
      };
      setStats(statsCalc);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organizations';
      setError(errorMessage);
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, take, debouncedSearch, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreateModal = () => {
    setFormData({
      name: '',
      businessType: '',
      registrationNumber: '',
      address: '',
      contactEmail: '',
      status: 'active',
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim()) {
      setFormError('Organization name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          businessType: formData.businessType || undefined,
          registrationNumber: formData.registrationNumber || undefined,
          address: formData.address || undefined,
          contactEmail: formData.contactEmail || undefined,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create organization');
      }

      setFormSuccess('Organization created successfully');
      setTimeout(() => {
        closeCreateModal();
        fetchData();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statCards = [
    { title: t('statTotal'), value: stats.total, description: t('statTotalDesc'), variant: 'blue' as const },
    { title: t('statActive'), value: stats.active, description: t('statActiveDesc'), variant: 'green' as const },
    { title: t('statInactive'), value: stats.inactive, description: t('statInactiveDesc'), variant: 'purple' as const },
  ];

  // Handlers for AdminToolbar
  const handleSearch = (query: string) => { setSearch(query); };
  const handleFilter = () => { console.log('Open filter modal'); };
  const handleExport = () => { console.log('Export to CSV'); };
  const handleRefresh = () => { fetchData(); };

  const toolbarTranslations = {
    searchPlaceholder: t('searchPlaceholder'),
    filter: tCommon('filter'),
    export: tCommon('export'),
    refresh: t('refresh'),
  };

  // Column translations
  const columns = {
    name: t('colName'),
    businessType: t('colBusinessType'),
    workspaces: t('colWorkspaces'),
    status: t('colStatus'),
    action: t('colActions'),
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
            {t('pageDescription')}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="create-btn"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('create')}
        </button>
      </div>

      {/* Stats Grid */}
      <AdminStatGrid cards={statCards} />

      {/* Toolbar */}
      <AdminToolbar
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onRefresh={handleRefresh}
        translations={toolbarTranslations}
      />

      {/* Error Display */}
      {error && (
        <div className="error-state">
          <div className="flex items-center gap-3 text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="block">{tCommon('error')}</strong>
              <span className="text-sm text-red-500">{error}</span>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-state">
          <div className="text-[#64748b]">{tCommon('loading')}</div>
        </div>
      ) : !error ? (
        <>
          <div className="table-container">
            {/* Table Header */}
            <div className="table-head" style={{ gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.7fr' }}>
              {[columns.name, columns.businessType, columns.workspaces, columns.status, columns.action].map((header, i) => (
                <div key={i} className="th" style={{ borderRight: i === 4 ? 'none' : '1px solid #dfe7f1' }}>
                  {header}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {organizations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-1">{t('emptyTitle')}</h3>
              </div>
            ) : (
              /* Table Rows */
              organizations.map((org, rowIndex) => (
                <div
                  key={org.id}
                  className="table-row"
                  style={{ gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.7fr', borderBottom: rowIndex === organizations.length - 1 ? 'none' : '1px solid #dfe7f1' }}
                >
                  {/* Name */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <div className="flex items-center gap-3">
                      <div className="icon-badge" style={{ background: 'linear-gradient(135deg, #ccfbf1, #eefbf8)', color: '#0f766e' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#0f172a]">{org.name}</span>
                          {org.isDefault && (
                            <span className="default-badge">{t('default')}</span>
                          )}
                        </div>
                        {org.contactEmail && (
                          <span className="text-xs text-[#64748b]">{org.contactEmail}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Type */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <span>{org.businessType || '—'}</span>
                  </div>

                  {/* Workspaces */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1' }}>
                    <span>{org._count?.workspaces || 0}</span>
                  </div>

                  {/* Status */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1' }}>
                    <StatusBadge status={org.status} />
                  </div>

                  {/* Action */}
                  <div className="td" style={{ borderRight: 'none' }}>
                    <button
                      className="action-link"
                      onClick={() => {
                        const locale = window.location.pathname.split('/')[1] || 'vi';
                        router.push(`/${locale}/admin/organizations/${org.id}`);
                      }}
                    >
                      {t('view')} →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <Paging
            current={page}
            pageSize={take}
            total={total}
            onChange={(newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize !== take) setTake(newPageSize);
            }}
            pageSizeOptions={[10, 20, 50]}
            totalLabel={`${t('of')} ${total} ${t('organizations')}`}
          />
        </>
      ) : null}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-icon">
                  <Building2 size={22} color="#087f78" />
                </div>
                <div>
                  <h3>{t('create')}</h3>
                  <p>{t('createModalDesc')}</p>
                </div>
              </div>
              <button className="modal-close" onClick={closeCreateModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>{t('formName')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('formNamePlaceholder')}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>{t('formBusinessType')}</label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    placeholder={t('formBusinessTypePlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label>{t('formRegistrationNumber')}</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder={t('formRegistrationNumberPlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>{t('formAddress')}</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('formAddressPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-field">
                <label>{t('formContactEmail')}</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder={t('formContactEmailPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-field">
                <label>{t('formStatus')}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="active">{t('statusActive')}</option>
                  <option value="inactive">{t('statusInactive')}</option>
                </select>
              </div>

              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">{formSuccess}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeCreateModal} disabled={isSubmitting}>
                  {tCommon('cancel')}
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting || !formData.name.trim()}>
                  {isSubmitting ? tCommon('loading') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
