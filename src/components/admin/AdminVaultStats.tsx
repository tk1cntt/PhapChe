'use client';

import { FolderOpen, FileText, Tag as TagIcon, ShieldCheck } from 'lucide-react';

export interface VaultStats {
  totalFolders: number;
  totalFiles: number;
  totalTags: number;
  securityPercent: number;
}

interface AdminVaultStatsProps {
  stats: VaultStats;
}

export function AdminVaultStats({ stats }: AdminVaultStatsProps) {
  return (
    <div className="vault-stats">
      <div className="vault-stat-card">
        <div className="vault-stat-icon blue">
          <FolderOpen size={30} />
        </div>
        <div>
          <div className="vault-stat-title">Tổng thư mục</div>
          <div className="vault-stat-value">{stats.totalFolders}</div>
          <div className="vault-stat-desc">Theo workspace</div>
        </div>
      </div>

      <div className="vault-stat-card">
        <div className="vault-stat-icon green">
          <FileText size={30} />
        </div>
        <div>
          <div className="vault-stat-title">Tệp pháp lý</div>
          <div className="vault-stat-value">{stats.totalFiles}</div>
          <div className="vault-stat-desc">Đã phân loại</div>
        </div>
      </div>

      <div className="vault-stat-card">
        <div className="vault-stat-icon orange">
          <TagIcon size={30} />
        </div>
        <div>
          <div className="vault-stat-title">Thẻ phân loại</div>
          <div className="vault-stat-value">{stats.totalTags}</div>
          <div className="vault-stat-desc">Contract, NDA, Compliance...</div>
        </div>
      </div>

      <div className="vault-stat-card">
        <div className="vault-stat-icon purple">
          <ShieldCheck size={30} />
        </div>
        <div>
          <div className="vault-stat-title">Bảo mật</div>
          <div className="vault-stat-value">{stats.securityPercent}%</div>
          <div className="vault-stat-desc">Có workspace scope</div>
        </div>
      </div>
    </div>
  );
}
