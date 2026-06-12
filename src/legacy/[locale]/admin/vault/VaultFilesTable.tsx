'use client';

import { useTranslations } from 'next-intl';

type FolderRow = { id: string; name: string };
type TagRow = { id: string; key: string; label: string };

type VaultFileClassification = {
  vaultFile: {
    id: string;
    filename: string | null;
    createdAt: Date | string;
    size?: number;
    workspace?: { name: string; slug: string };
    createdBy?: { name: string; email: string };
    folders?: FolderRow[];
    tags?: TagRow[];
  };
  folders: FolderRow[];
  tags: TagRow[];
};

type VaultFilesTableProps = {
  classifications: VaultFileClassification[];
  folders: FolderRow[];
  tags: TagRow[];
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
    case 'PDF': return { bg: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb' };
    case 'DOC': return { bg: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#1d4ed8' };
    case 'XLS': return { bg: 'linear-gradient(135deg, #d1fae5, #ecfdf5)', color: '#059669' };
    case 'ZIP': case 'RAR': return { bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)', color: '#d97706' };
    default: return { bg: 'linear-gradient(135deg, #e0e7ff, #eef2ff)', color: '#4f46e5' };
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const tagChipStyles: Record<string, { bg: string; color: string }> = {
  contract_review: { bg: '#dbeafe', color: '#2563eb' },
  urgent_sla: { bg: '#ffe4e6', color: '#ef4444' },
  internal_only: { bg: '#ede9fe', color: '#7c3aed' },
  compliance: { bg: '#d1fae5', color: '#059669' },
};

function getTagChipStyle(key: string): { bg: string; color: string } {
  return tagChipStyles[key] ?? { bg: '#e0e7ff', color: '#4f46e5' };
}

export function VaultFilesTable({ classifications }: VaultFilesTableProps) {
  const t = useTranslations('Vault');

  return (
    <div style={{
      borderRadius: 15,
      border: '1px solid #dfe7f1',
      boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
      overflow: 'hidden',
      background: '#fff',
    }}>
      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 0.8fr 1fr 0.8fr 0.8fr 0.7fr',
        background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
        borderBottom: '1px solid #dfe7f1',
      }}>
        {[t('fileName'), t('folders'), t('tags'), t('workspaceCol'), t('owner'), t('security'), t('action')].map((header, i) => (
          <div key={i} style={{
            padding: '14px 18px',
            fontSize: 14,
            fontWeight: 700,
            color: '#59687e',
            borderRight: i < 6 ? '1px solid #dfe7f1' : 'none',
          }}>
            {header}
          </div>
        ))}
      </div>

      {/* Table Rows */}
      {classifications.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          {t('noFiles')}
        </div>
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
          const allFolders = record.folders.length > 0 ? record.folders : record.vaultFile.folders ?? [];
          const allTags = record.tags.length > 0 ? record.tags : record.vaultFile.tags ?? [];

          return (
            <div key={record.vaultFile.id} style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 0.8fr 1fr 0.8fr 0.8fr 0.7fr',
              borderBottom: '1px solid #eef3f8',
              minHeight: 72,
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fbfdff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {/* File name + icon */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderRight: '1px solid #eef3f8' }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: iconStyle.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: iconStyle.color,
                  flexShrink: 0,
                }}>
                  {ext}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                    {record.vaultFile.filename ?? t('unnamed')}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {sizeStr}{sizeStr && ' · '}{t('updated')} {dateStr}
                  </div>
                </div>
              </div>

              {/* Folders */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', borderRight: '1px solid #eef3f8' }}>
                {allFolders.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{allFolders[0].name}</div>
                    {allFolders[0] && <div style={{ fontSize: 12, color: '#64748b' }}>folder/{allFolders[0].name.toLowerCase().replace(/\s+/g, '-')}</div>}
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                )}
              </div>

              {/* Tags */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, borderRight: '1px solid #eef3f8' }}>
                {allTags.length > 0 ? (
                  allTags.map((tag) => {
                    const chipStyle = getTagChipStyle(tag.key);
                    return (
                      <span key={tag.id} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 26,
                        padding: '0 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: chipStyle.bg,
                        color: chipStyle.color,
                      }}>
                        {tag.label}
                      </span>
                    );
                  })
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                )}
              </div>

              {/* Workspace */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', borderRight: '1px solid #eef3f8' }}>
                {workspace ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{workspace.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{workspace.slug}</div>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                )}
              </div>

              {/* Owner */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', borderRight: '1px solid #eef3f8' }}>
                {owner ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{owner.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{owner.email}</div>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                )}
              </div>

              {/* Security */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', borderRight: '1px solid #eef3f8' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 28,
                  padding: '0 11px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  background: '#ccfbf1',
                  color: '#0f766e',
                  gap: 7,
                }}>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                  }} />
                  {t('encrypted')}
                </span>
              </div>

              {/* Action */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center' }}>
                <a
                  href={`/api/vault/${record.vaultFile.id}/download`}
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#087f78',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('openFile')} →
                </a>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
