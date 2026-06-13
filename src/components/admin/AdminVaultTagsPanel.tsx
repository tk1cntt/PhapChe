'use client';

import { useState } from 'react';
import { Tag as TagIcon, Search, Plus } from 'lucide-react';

export interface VaultTag {
  id: string;
  key: string;
  label?: string;
  label_vi?: string | null;
  label_en?: string | null;
  description?: string;
  color?: string;
  _count?: { vaultFileTags: number };
}

interface AdminVaultTagsPanelProps {
  tags: VaultTag[];
}

const tagColorMap: Record<string, { bg: string; color: string }> = {
  contract: { bg: '#dbeafe', color: '#2563eb' },
  urgent: { bg: '#ffe4e6', color: '#ef4444' },
  internal: { bg: '#ede9fe', color: '#7c3aed' },
  compliance: { bg: '#ccfbf1', color: '#0f766e' },
  dpa: { bg: '#ccfbf1', color: '#0f766e' },
  nda: { bg: '#ede9fe', color: '#7c3aed' },
  sla: { bg: '#ffe4e6', color: '#ef4444' },
};

function getTagChipStyle(keyOrColor?: string): { bg: string; color: string } {
  if (!keyOrColor) return { bg: '#eef2f7', color: '#334155' };
  const lower = keyOrColor.toLowerCase();
  return tagColorMap[lower] ?? { bg: '#eef2f7', color: '#334155' };
}

export function AdminVaultTagsPanel({ tags }: AdminVaultTagsPanelProps) {
  const [search, setSearch] = useState('');

  const filteredTags = tags.filter((tg) => {
    const label = tg.label_vi || tg.label || tg.label_en || tg.key || '';
    return label.toLowerCase().includes(search.toLowerCase()) ||
           tg.key.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="vault-panel">
      <div className="vault-panel-header">
        <div className="vault-panel-title-left">
          <TagIcon size={22} color="#087f78" />
          <span>Thẻ phân loại</span>
        </div>
        <button className="vault-create-btn">
          <Plus size={14} />
          Tạo thẻ
        </button>
      </div>

      <div className="vault-search-box">
        <Search size={16} color="#94a3b8" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm thẻ..."
        />
      </div>

      <div className="vault-item-list">
        {filteredTags.length === 0 ? (
          <p className="vault-empty-state">Chưa có thẻ nào.</p>
        ) : (
          filteredTags.map((tag) => {
            const chipStyle = getTagChipStyle(tag.color ?? tag.key);
            return (
              <div key={tag.id} className="vault-item">
                <div className="vault-item-left">
                  <div className="vault-item-icon tag">#</div>
                  <div className="vault-item-info">
                    <strong>{tag.label_vi || tag.label || tag.label_en || tag.key}</strong>
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
                  {tag._count?.vaultFileTags ?? 0} tệp
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
