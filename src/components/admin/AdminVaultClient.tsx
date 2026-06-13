'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { AdminVaultStats, type VaultStats } from './AdminVaultStats';
import { AdminVaultFoldersPanel } from './AdminVaultFoldersPanel';
import { AdminVaultTagsPanel } from './AdminVaultTagsPanel';
import { AdminVaultToolbar } from './AdminVaultToolbar';
import { AdminVaultFilesTable } from './AdminVaultFilesTable';

interface FolderRow {
  id: string;
  name: string;
  name_vi?: string | null;
  name_en?: string | null;
  slug?: string;
  description?: string;
  _count?: { children: number; vaultFileFolders: number };
}

interface TagRow {
  id: string;
  key: string;
  label?: string;
  label_vi?: string | null;
  label_en?: string | null;
  description?: string;
  color?: string;
  _count?: { vaultFileTags: number };
}

interface VaultFileClassification {
  vaultFile: {
    id: string;
    filename: string | null;
    createdAt: Date | string;
    size?: number;
    workspace?: { name: string; slug: string };
    createdBy?: { name: string; email: string };
  };
  folders: { id: string; name: string; name_vi?: string | null }[];
  tags: { id: string; key: string; label?: string; label_vi?: string | null }[];
}

interface VaultData {
  folders: FolderRow[];
  tags: TagRow[];
  classifications: VaultFileClassification[];
}

export default function AdminVaultClient() {
  const router = useRouter();
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);

      const url = `/api/vault${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch vault data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      console.error('Error fetching vault data:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, router]);

  // Fetch on mount and when search changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute stats from data
  const stats: VaultStats = {
    totalFolders: data?.folders?.length ?? 0,
    totalFiles: data?.classifications?.length ?? 0,
    totalTags: data?.tags?.length ?? 0,
    securityPercent: (data?.classifications?.length ?? 0) > 0 ? 96 : 0,
  };

  // Filter classifications based on search
  const filteredClassifications = data?.classifications.filter((c) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    const filename = c.vaultFile.filename?.toLowerCase() ?? '';
    const folderNames = c.folders.map(f => (f.name_vi || f.name || '').toLowerCase());
    const tagKeys = c.tags.map(t => t.key.toLowerCase());
    return filename.includes(searchLower) ||
           folderNames.some(n => n.includes(searchLower)) ||
           tagKeys.some(k => k.includes(searchLower));
  }) ?? [];

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="vault-client">
      {/* Page Header */}
      <div className="vault-page-header">
        <div>
          <h1>Phân loại vault</h1>
          <p className="vault-subtitle">
            Tạo thư mục và thẻ để tổ chức hồ sơ pháp lý, phân quyền truy cập và theo dõi tài liệu an toàn.
          </p>
        </div>
        <button className="vault-upload-btn">
          <Upload size={18} />
          Tải tệp lên
        </button>
      </div>

      {/* Stats */}
      <AdminVaultStats stats={stats} />

      {/* Folder / Tag Panels */}
      <div className="vault-panels-grid">
        <AdminVaultFoldersPanel folders={data?.folders ?? []} />
        <AdminVaultTagsPanel tags={data?.tags ?? []} />
      </div>

      {/* Toolbar */}
      <AdminVaultToolbar
        search={search}
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Error state */}
      {error && (
        <div className="vault-error-card">
          <div className="vault-error-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <strong>Không thể tải dữ liệu vault</strong>
          </div>
          <p>{error}</p>
          <button onClick={handleRefresh}>Thử lại</button>
        </div>
      )}

      {/* File Table */}
      {!error && (
        <AdminVaultFilesTable
          classifications={filteredClassifications}
          loading={loading}
        />
      )}
    </div>
  );
}
