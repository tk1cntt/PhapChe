'use client';

import { useState } from 'react';
import { FolderOpen, Search, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface VaultFolder {
  id: string;
  name: string;
  name_vi?: string | null;
  name_en?: string | null;
  slug?: string;
  description?: string;
  _count?: { children: number; vaultFileFolders: number };
}

interface AdminVaultFoldersPanelProps {
  folders: VaultFolder[];
}

export function AdminVaultFoldersPanel({ folders }: AdminVaultFoldersPanelProps) {
  const t = useTranslations('Vault');
  const [search, setSearch] = useState('');

  const filteredFolders = folders.filter((f) => {
    const name = f.name_vi || f.name || f.name_en || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="vault-panel">
      <div className="vault-panel-header">
        <div className="vault-panel-title-left">
          <FolderOpen size={22} color="#087f78" />
          <span>{t('folders')}</span>
        </div>
        <button className="vault-create-btn">
          <Plus size={14} />
          {t('createFolder')}
        </button>
      </div>

      <div className="vault-search-box">
        <Search size={16} color="#94a3b8" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
        />
      </div>

      <div className="vault-item-list">
        {filteredFolders.length === 0 ? (
          <p className="vault-empty-state">{t('noFolders')}</p>
        ) : (
          filteredFolders.map((folder) => (
            <div key={folder.id} className="vault-item">
              <div className="vault-item-left">
                <div className="vault-item-icon">📁</div>
                <div className="vault-item-info">
                  <strong>{folder.name_vi || folder.name || folder.name_en || '—'}</strong>
                  <span>{folder.description ?? folder.slug ?? '—'}</span>
                </div>
              </div>
              <div className="vault-item-badge">
                {folder._count?.vaultFileFolders ?? 0} {t('files')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
