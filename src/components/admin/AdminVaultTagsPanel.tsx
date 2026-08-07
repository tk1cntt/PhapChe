'use client';

import { useState } from 'react';
import { Tag as TagIcon, Search, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface VaultTag {
  id: string;
  key: string;
  label: string | null;
  description?: string;
  color?: string;
  _count?: { vaultFileTags: number };
}

interface AdminVaultTagsPanelProps {
  tags: VaultTag[];
}

const STYLE_INFO = { bg: '#dbeafe', color: 'var(--color-info)' } as const;
const STYLE_DANGER = { bg: '#ffe4e6', color: 'var(--color-danger)' } as const;
const STYLE_PURPLE = { bg: '#ede9fe', color: '#7c3aed' } as const;
const STYLE_PRIMARY = { bg: '#ccfbf1', color: 'var(--color-primary)' } as const;
const STYLE_DEFAULT = { bg: '#eef2f7', color: 'var(--color-text-secondary)' } as const;

const tagColorMap: Record<string, { bg: string; color: string }> = {
  contract: STYLE_INFO,
  urgent: STYLE_DANGER,
  internal: STYLE_PURPLE,
  compliance: STYLE_PRIMARY,
  dpa: STYLE_PRIMARY,
  nda: STYLE_PURPLE,
  sla: STYLE_DANGER,
};
  internal: STYLE_PURPLE,
  compliance: STYLE_PRIMARY,
  dpa: STYLE_PRIMARY,
  nda: STYLE_PURPLE,
  sla: STYLE_DANGER,
};

export function AdminVaultTagsPanel({ tags }: AdminVaultTagsPanelProps) {
  const t = useTranslations('Vault');
  const [search, setSearch] = useState('');

  const filteredTags = tags.filter((tag) => {
    const label = tag.label || tag.key || '';
    return label.toLowerCase().includes(search.toLowerCase()) ||
           tag.key.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="vault-panel">
      <div className="vault-panel-header">
        <div className="vault-panel-title-left">
          <TagIcon size={22} color="#087f78" />
          <span>{t('tags')}</span>
        </div>
        <button className="vault-create-btn">
          <Plus size={14} />
          {t('createTag')}
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
        {filteredTags.length === 0 ? (
          <p className="vault-empty-state">{t('noTags')}</p>
        ) : (
          filteredTags.map((tag) => {
            const chipStyle = getTagChipStyle(tag.color ?? tag.key);
            return (
              <div key={tag.id} className="vault-item">
                <div className="vault-item-left">
                  <div className="vault-item-icon tag">#</div>
                  <div className="vault-item-info">
                    <strong>{tag.label || tag.key}</strong>
                    <span>{tag.description ?? tag.key}</span>
                  </div>
                </div>
                <div
                  className="vault-item-badge"
                  style={{
                    background: chipStyle.bg,
                    color: chipStyle.color,
                  }}
                >
                  {tag._count?.vaultFileTags ?? 0} {t('files')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
