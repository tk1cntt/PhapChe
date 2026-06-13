'use client';

import { useTranslations } from 'next-intl';

type FolderRow = { id: string; name: string; name_vi?: string | null };
type TagRow = { id: string; key: string; label?: string; label_vi?: string | null };

type VaultFileClassification = {
  vaultFile: {
    id: string;
    filename: string | null;
    createdAt: Date | string;
    size?: number;
    workspace?: { name: string; slug: string };
    createdBy?: { name: string; email: string };
  };
  folders: FolderRow[];
  tags: TagRow[];
};

type AdminVaultFilesTableProps = {
  classifications: VaultFileClassification[];
  loading?: boolean;
};

function getFileExt(filename: string | null): string {
  if (!filename) return 'FILE';
  const ext = filename.split('.').pop()?.toUpperCase() ?? 'FILE';
  if (['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'ZIP', 'RAR', 'PNG', 'JPG'].includes(ext)) {
    return ext.length > 3 ? ext.slice(0, 3) : ext;
  }
  return ext.slice(0, 3);
}

function getFileIconStyle(ext: string): { bg: string; color: string } {
  switch (ext) {
    case 'PDF':
      return { bg: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb' };
    case 'DOC':
    case 'DOCX':
      return { bg: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#1d4ed8' };
    case 'XLS':
    case 'XLSX':
      return { bg: 'linear-gradient(135deg, #d1fae5, #ecfdf5)', color: '#059669' };
    case 'ZIP':
    case 'RAR':
      return { bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)', color: '#d97706' };
    default:
      return { bg: 'linear-gradient(135deg, #e0e7ff, #eef2ff)', color: '#4f46e5' };
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const tagChipStyles: Record<string, { bg: string; color: string }> = {
  contract: { bg: '#dbeafe', color: '#2563eb' },
  contract_review: { bg: '#dbeafe', color: '#2563eb' },
  urgent: { bg: '#ffe4e6', color: '#ef4444' },
  urgent_sla: { bg: '#ffe4e6', color: '#ef4444' },
  internal: { bg: '#ede9fe', color: '#7c3aed' },
  internal_only: { bg: '#ede9fe', color: '#7c3aed' },
  compliance: { bg: '#d1fae5', color: '#059669' },
  dpa: { bg: '#d1fae5', color: '#059669' },
  nda: { bg: '#ede9fe', color: '#7c3aed' },
};

function getTagChipStyle(key: string): { bg: string; color: string } {
  const lower = key.toLowerCase();
  return tagChipStyles[lower] ?? { bg: '#e0e7ff', color: '#4f46e5' };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/[đ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminVaultFilesTable({ classifications, loading }: AdminVaultFilesTableProps) {
  if (loading) {
    return (
      <div className="vault-table-card">
        <div className="vault-table-head">
          <div className="vault-th">Tên tệp</div>
          <div className="vault-th">Thư mục</div>
          <div className="vault-th">Thẻ</div>
          <div className="vault-th">Workspace</div>
          <div className="vault-th">Chủ sở hữu</div>
          <div className="vault-th">Bảo mật</div>
          <div className="vault-th">Thao tác</div>
        </div>
        <div className="vault-loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="vault-table-card">
      {/* Table Header */}
      <div className="vault-table-head">
        <div className="vault-th">Tên tệp</div>
        <div className="vault-th">Thư mục</div>
        <div className="vault-th">Thẻ</div>
        <div className="vault-th">Workspace</div>
        <div className="vault-th">Chủ sở hữu</div>
        <div className="vault-th">Bảo mật</div>
        <div className="vault-th">Thao tác</div>
      </div>

      {/* Table Rows */}
      {classifications.length === 0 ? (
        <div className="vault-empty">Chưa có tệp nào.</div>
      ) : (
        classifications.map((record) => {
          const ext = getFileExt(record.vaultFile.filename);
          const iconStyle = getFileIconStyle(ext);
          const date = record.vaultFile.createdAt instanceof Date
            ? record.vaultFile.createdAt
            : new Date(record.vaultFile.createdAt);
          const dateStr = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
          const sizeStr = formatFileSize(record.vaultFile.size);
          const workspace = record.vaultFile.workspace;
          const owner = record.vaultFile.createdBy;

          // Get first folder name
          const folderName = record.folders.length > 0
            ? record.folders[0].name_vi || record.folders[0].name
            : null;
          const folderSlug = folderName ? slugify(folderName) : null;

          return (
            <div key={record.vaultFile.id} className="vault-table-row">
              {/* File name + icon */}
              <div className="vault-td">
                <div className="vault-file-cell">
                  <div className="vault-file-icon" style={iconStyle}>
                    {ext}
                  </div>
                  <div className="vault-file-info">
                    <strong>{record.vaultFile.filename ?? '(không tên)'}</strong>
                    <span>{sizeStr}{sizeStr && ' · '}cập nhật {dateStr}</span>
                  </div>
                </div>
              </div>

              {/* Folders */}
              <div className="vault-td">
                {folderName ? (
                  <div className="vault-stack">
                    <strong>{folderName}</strong>
                    <span>folder/{folderSlug}</span>
                  </div>
                ) : (
                  <span className="vault-empty-cell">—</span>
                )}
              </div>

              {/* Tags */}
              <div className="vault-td">
                {record.tags.length > 0 ? (
                  record.tags.map((tag) => {
                    const chipStyle = getTagChipStyle(tag.key);
                    return (
                      <span
                        key={tag.id}
                        className="vault-tag-chip"
                        style={{
                          background: chipStyle.bg,
                          color: chipStyle.color,
                        }}
                      >
                        {tag.label_vi || tag.label || tag.key}
                      </span>
                    );
                  })
                ) : (
                  <span className="vault-empty-cell">—</span>
                )}
              </div>

              {/* Workspace */}
              <div className="vault-td">
                {workspace ? (
                  <div className="vault-stack">
                    <strong>{workspace.name}</strong>
                    <span>{workspace.slug || slugify(workspace.name)}</span>
                  </div>
                ) : (
                  <span className="vault-empty-cell">—</span>
                )}
              </div>

              {/* Owner */}
              <div className="vault-td">
                {owner ? (
                  <div className="vault-stack">
                    <strong>{owner.name}</strong>
                    <span>{owner.email}</span>
                  </div>
                ) : (
                  <span className="vault-empty-cell">—</span>
                )}
              </div>

              {/* Security */}
              <div className="vault-td">
                <span className="vault-badge vault-badge-green">
                  <span className="vault-badge-dot" />
                  Đã mã hóa
                </span>
              </div>

              {/* Action */}
              <div className="vault-td">
                <a
                  href={`/api/vault/${record.vaultFile.id}/download`}
                  className="vault-action-link"
                >
                  Mở tệp →
                </a>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
