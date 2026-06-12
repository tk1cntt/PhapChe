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
import './vault.css';

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
    <div className="vault-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>{t('pageTitle')}</h1>
          <p className="subtitle">{t('pageDescription')}</p>
        </div>
        <button className="upload-btn">
          <Upload size={18} />
          {t('uploadFile')}
        </button>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FolderOpen size={30} />
          </div>
          <div>
            <div className="stat-title">{t('statFolders')}</div>
            <div className="stat-value">{folders.length}</div>
            <div className="stat-desc">{t('statFoldersDesc')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FileText size={30} />
          </div>
          <div>
            <div className="stat-title">{t('statLegalFiles')}</div>
            <div className="stat-value">{totalFiles}</div>
            <div className="stat-desc">{t('statLegalFilesDesc')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <TagIcon size={30} />
          </div>
          <div>
            <div className="stat-title">{t('statTags')}</div>
            <div className="stat-value">{tags.length}</div>
            <div className="stat-desc">{t('statTagsDesc')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <ShieldCheck size={30} />
          </div>
          <div>
            <div className="stat-title">{t('statSecurity')}</div>
            <div className="stat-value">{uniqueUsers > 0 ? Math.round((uniqueUsers / Math.max(totalFiles, 1)) * 100) : 0}%</div>
            <div className="stat-desc">{t('statSecurityDesc')}</div>
          </div>
        </div>
      </div>

      {/* Folder / Tag Panels */}
      <div className="panels-grid">
        {/* Folder Panel */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title-left">
              <FolderOpen size={22} color="#087f78" />
              {t('folders')}
            </div>
            <button className="create-btn">
              {t('createFolderBtn')}
            </button>
          </div>

          <div className="search-box">
            <Search size={16} color="#94a3b8" />
            <input
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
              placeholder={t('searchFolder')}
            />
          </div>

          <div style={{ display: 'grid', gap: 13 }}>
            {filteredFolders.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 24, fontSize: 14 }}>
                {t('noFolders')}
              </p>
            ) : (
              filteredFolders.map((folder) => (
                <div key={folder.id} className="item">
                  <div className="item-left">
                    <div className="item-icon">📁</div>
                    <div className="item-info">
                      <strong>{folder.name}</strong>
                      <span>{folder.description ?? folder.slug ?? '—'}</span>
                    </div>
                  </div>
                  <div className="item-badge">
                    {t('folderCount', { count: folder._count?.vaultFileFolders ?? 0 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tag Panel */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title-left">
              <TagIcon size={22} color="#087f78" />
              {t('tags')}
            </div>
            <button className="create-btn">
              {t('createTagBtn')}
            </button>
          </div>

          <div className="search-box">
            <Search size={16} color="#94a3b8" />
            <input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder={t('searchTag')}
            />
          </div>

          <div className="item-list">
            {filteredTags.length === 0 ? (
              <p className="empty-state">{t('noTags')}</p>
            ) : (
              filteredTags.map((tag) => {
                const chipStyle = getTagChipStyle(tag.color ?? tag.key);
                return (
                  <div key={tag.id} className="item">
                    <div className="item-left">
                      <div className="item-icon tag">#</div>
                      <div className="item-info">
                        <strong>{tag.label}</strong>
                        <span>{tag.description ?? tag.key}</span>
                      </div>
                    </div>
                    <div
                      className="item-badge"
                      style={{
                        background: chipStyle.bg,
                        color: chipStyle.color,
                      }}
                    >
                      {t('folderCount', { count: tag._count?.vaultFileTags ?? 0 })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-inner">
          <div className="toolbar-left">
            <div className="toolbar-search">
              <Search size={19} color="#718096" />
              <input
                placeholder={t('toolbarSearchPlaceholder')}
              />
            </div>
            <button className="toolbar-btn">
              <Filter size={18} />
              {t('filterBtn')}
            </button>
            <button className="toolbar-btn">
              {t('folderDropdown')}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button className="toolbar-btn">
              {t('tagDropdown')}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
          <div className="toolbar-right">
            <button className="toolbar-btn icon">
              <RefreshCw size={19} color="#0f172a" />
            </button>
            <button className="toolbar-btn">
              {t('export')}
            </button>
            <button className="toolbar-btn">
              <SlidersHorizontal size={18} />
              {t('columnsBtn')}
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
