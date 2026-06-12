'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  FolderOpen,
  Search,
  ShieldCheck,
  Tag as TagIcon,
  Upload,
  Filter,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { VaultFilesTable } from './VaultFilesTable';

interface VaultFolderRaw {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  _count?: { children: number; vaultFileFolders: number };
}

interface VaultTagRaw {
  id: string;
  key: string;
  label: string;
  description?: string;
  color?: string;
  _count?: { vaultFileTags: number };
}

interface VaultClassification {
  vaultFile: { id: string; filename: string | null; createdAt: string | Date };
  folders: { id: string; name: string }[];
  tags: { id: string; key: string; label: string }[];
}

interface VaultData {
  folders: VaultFolderRaw[];
  tags: VaultTagRaw[];
  classifications: VaultClassification[];
}

function StatCard({
  icon,
  title,
  value,
  desc,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  desc: string;
  variant: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const variantStyles: Record<string, { iconBg: string; iconColor: string }> = {
    blue: {
      iconBg: 'linear-gradient(135deg, #dfe8ff, #eef4ff)',
      iconColor: '#2563eb',
    },
    green: {
      iconBg: 'linear-gradient(135deg, #d4f4ed, #eefbf8)',
      iconColor: '#0f766e',
    },
    orange: {
      iconBg: 'linear-gradient(135deg, #ffe2bf, #fff1df)',
      iconColor: '#f97316',
    },
    purple: {
      iconBg: 'linear-gradient(135deg, #ede9fe, #f5f3ff)',
      iconColor: '#7c3aed',
    },
  };
  const s = variantStyles[variant];

  return (
    <div
      style={{
        height: 126,
        background: '#fff',
        border: '1px solid #dfe7f1',
        borderRadius: 15,
        display: 'flex',
        alignItems: 'center',
        padding: '24px 22px',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 18,
          background: s.iconBg,
          color: s.iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, color: '#566579', fontWeight: 600, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 10, color: '#0f172a' }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{desc}</div>
      </div>
    </div>
  );
}

const folderIconBg = 'linear-gradient(135deg, #dbeafe, #eff6ff)';

const tagColorMap: Record<string, { bg: string; color: string }> = {
  contract: { bg: '#dbeafe', color: '#2563eb' },
  urgent: { bg: '#ffe4e6', color: '#ef4444' },
  internal: { bg: '#ede9fe', color: '#7c3aed' },
  compliance: { bg: '#ccfbf1', color: '#0f766e' },
  red: { bg: '#ffe4e6', color: '#ef4444' },
  blue: { bg: '#dbeafe', color: '#2563eb' },
  green: { bg: '#ccfbf1', color: '#0f766e' },
  purple: { bg: '#ede9fe', color: '#7c3aed' },
  orange: { bg: '#ffedd5', color: '#ea580c' },
};

function getTagChipStyle(keyOrColor?: string) {
  if (!keyOrColor) return { bg: '#eef2f7', color: '#334155' };
  const lower = keyOrColor.toLowerCase();
  return tagColorMap[lower] ?? { bg: '#eef2f7', color: '#334155' };
}

export default function VaultPageClient() {
  const t = useTranslations('Vault');
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [folderSearch, setFolderSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  useEffect(() => {
    fetch('/api/vault')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const { folders, tags, classifications } = data;

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(folderSearch.toLowerCase()),
  );

  const filteredTags = tags.filter(
    (tg) =>
      tg.label.toLowerCase().includes(tagSearch.toLowerCase()) ||
      tg.key.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const totalFiles = classifications.length;
  const uniqueUsers = new Set(classifications.map((c) => c.vaultFile.id)).size;

  return (
    <div style={{ padding: '31px 36px 42px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 31,
              fontWeight: 800,
              letterSpacing: -0.8,
              marginBottom: 12,
              color: '#020617',
            }}
          >
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, color: '#5f6e83', fontWeight: 500 }}>
            {t('pageDescription')}
          </p>
        </div>
        <button
          style={{
            height: 45,
            padding: '0 18px',
            border: 'none',
            borderRadius: 8,
            background: 'linear-gradient(180deg, #0b8f86, #087970)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
            cursor: 'pointer',
          }}
        >
          <Upload size={18} />
          Tải tệp lên
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<FolderOpen size={30} />}
          title="Tổng thư mục"
          value={folders.length}
          desc="Theo workspace"
          variant="blue"
        />
        <StatCard
          icon={<FileText size={30} />}
          title="Tệp pháp lý"
          value={totalFiles}
          desc="Đã phân loại"
          variant="green"
        />
        <StatCard
          icon={<TagIcon size={30} />}
          title="Thẻ phân loại"
          value={tags.length}
          desc="Contract, NDA, Compliance..."
          variant="orange"
        />
        <StatCard
          icon={<ShieldCheck size={30} />}
          title="Bảo mật"
          value={`${uniqueUsers > 0 ? Math.round((uniqueUsers / Math.max(totalFiles, 1)) * 100) : 0}%`}
          desc="Có workspace scope"
          variant="purple"
        />
      </div>

      {/* Folder / Tag Panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Folder Panel */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #dfe7f1',
            borderRadius: 15,
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FolderOpen size={22} color="#087f78" />
              Thư mục
            </div>
            <button
              style={{
                height: 34,
                padding: '0 12px',
                border: '1px solid #dfe7f1',
                background: '#fff',
                color: '#087f78',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              + Tạo thư mục
            </button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                width: '100%',
                height: 40,
                border: '1px solid #dfe7f1',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 14px',
                background: '#fff',
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                placeholder={t('searchFolder')}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: 14,
                  background: 'transparent',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 13 }}>
            {filteredFolders.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 24, fontSize: 14 }}>
                {t('noFolders')}
              </p>
            ) : (
              filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  style={{
                    minHeight: 72,
                    border: '1px solid #edf2f7',
                    borderRadius: 12,
                    background: '#fbfdff',
                    padding: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: folderIconBg,
                        color: '#2563eb',
                        fontSize: 18,
                      }}
                    >
                      📁
                    </div>
                    <div>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 14,
                          marginBottom: 5,
                          color: '#0f172a',
                        }}
                      >
                        {folder.name}
                      </strong>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 12,
                          color: '#64748b',
                          lineHeight: 1.4,
                        }}
                      >
                        {folder.description ?? folder.slug ?? '—'}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 28,
                      padding: '0 11px',
                      borderRadius: 999,
                      background: '#eef2f7',
                      color: '#334155',
                      fontWeight: 800,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {folder._count?.vaultFileFolders ?? 0} tệp
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tag Panel */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #dfe7f1',
            borderRadius: 15,
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TagIcon size={22} color="#087f78" />
              Thẻ phân loại
            </div>
            <button
              style={{
                height: 34,
                padding: '0 12px',
                border: '1px solid #dfe7f1',
                background: '#fff',
                color: '#087f78',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              + Tạo thẻ
            </button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                width: '100%',
                height: 40,
                border: '1px solid #dfe7f1',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 14px',
                background: '#fff',
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder={t('searchTag')}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: 14,
                  background: 'transparent',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 13 }}>
            {filteredTags.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 24, fontSize: 14 }}>
                {t('noTags')}
              </p>
            ) : (
              filteredTags.map((tag) => {
                const chipStyle = getTagChipStyle(tag.color ?? tag.key);
                return (
                  <div
                    key={tag.id}
                    style={{
                      minHeight: 72,
                      border: '1px solid #edf2f7',
                      borderRadius: 12,
                      background: '#fbfdff',
                      padding: 15,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background: 'linear-gradient(135deg, #d4f4ed, #eefbf8)',
                          color: '#087f78',
                          fontWeight: 800,
                          fontSize: 16,
                        }}
                      >
                        #
                      </div>
                      <div>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: 14,
                            marginBottom: 5,
                            color: '#0f172a',
                          }}
                        >
                          {tag.label}
                        </strong>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 12,
                            color: '#64748b',
                            lineHeight: 1.4,
                          }}
                        >
                          {tag.description ?? tag.key}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 28,
                        padding: '0 11px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        background: chipStyle.bg,
                        color: chipStyle.color,
                        flexShrink: 0,
                      }}
                    >
                      {tag._count?.vaultFileTags ?? 0} tệp
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #dfe7f1',
          borderRadius: 15,
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 360,
                height: 44,
                border: '1px solid #dfe7f1',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '0 14px',
                color: '#718096',
                background: '#fff',
              }}
            >
              <Search size={19} color="#718096" />
              <input
                placeholder="Tìm tệp, thư mục, thẻ, workspace..."
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: 14,
                  background: 'transparent',
                }}
              />
            </div>
            <button
              style={{
                height: 44,
                border: '1px solid #dfe7f1',
                background: '#fff',
                borderRadius: 8,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Filter size={18} />
              Bộ lọc
            </button>
            <button
              style={{
                height: 44,
                border: '1px solid #dfe7f1',
                background: '#fff',
                borderRadius: 8,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Thư mục
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button
              style={{
                height: 44,
                border: '1px solid #dfe7f1',
                background: '#fff',
                borderRadius: 8,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Thẻ
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{
                height: 44,
                width: 52,
                border: '1px solid #dfe7f1',
                background: '#fff',
                borderRadius: 8,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={19} color="#0f172a" />
            </button>
            <button
              style={{
                height: 44,
                border: '1px solid #dfe7f1',
                background: '#fff',
                borderRadius: 8,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Export
            </button>
            <button
              style={{
                height: 44,
                border: '1px solid #dfe7f1',
                background: '#fff',
                borderRadius: 8,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={18} />
              Cột hiển thị
            </button>
          </div>
        </div>
      </div>

      {/* File Table */}
      <VaultFilesTable
        classifications={classifications}
        folders={folders.map((f) => ({ id: f.id, name: f.name }))}
        tags={tags.map((tg) => ({ id: tg.id, key: tg.key, label: tg.label }))}
      />
    </div>
  );
}
