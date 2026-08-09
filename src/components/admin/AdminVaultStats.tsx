'use client';

import { FolderOpen, FileText, Tag as TagIcon, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Vault');

  return (
    <div className="vault-stats">
      <div className="vault-stat-card">
        <div className="vault-stat-icon blue">
          <FolderOpen size={30} />
        </div>
        <div>
          <div className="vault-stat-title">{t('statTotalFolders')}</div>
          <div className="vault-stat-value">{stats.totalFolders}</div>
          <div className="vault-stat-desc">{t('statTotalFoldersDesc')}</div>
        </div>
      </div>

      <div className="vault-stat-card">
        <div className="vault-stat-icon green">
          <FileText size={30} />
        </div>
        <div>
          <div className="vault-stat-title">{t('statTotalFiles')}</div>
          <div className="vault-stat-value">{stats.totalFiles}</div>
          <div className="vault-stat-desc">{t('statTotalFilesDesc')}</div>
        </div>
      </div>

      <div className="vault-stat-card">
        <div className="vault-stat-icon orange">
          <TagIcon size={30} />
        </div>
        <div>
          <div className="vault-stat-title">{t('statTotalTags')}</div>
          <div className="vault-stat-value">{stats.totalTags}</div>
          <div className="vault-stat-desc">{t('statTotalTagsDesc')}</div>
        </div>
      </div>

      <div className="vault-stat-card">
        <div className="vault-stat-icon purple">
          <ShieldCheck size={30} />
        </div>
        <div>
          <div className="vault-stat-title">{t('statSecurity')}</div>
          <div className="vault-stat-value">{stats.securityPercent}%</div>
          <div className="vault-stat-desc">{t('statSecurityDesc')}</div>
        </div>
      </div>
    </div>
  );
}
