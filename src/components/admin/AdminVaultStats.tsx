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
    const statCards = [
      { icon: FolderOpen,      color: 'blue',   title: t('statTotalFolders'), value: stats.totalFolders,      desc: t('statTotalFoldersDesc') },
      { icon: FileText,        color: 'green',  title: t('statTotalFiles'),   value: stats.totalFiles,        desc: t('statTotalFilesDesc') },
      { icon: TagIcon,         color: 'orange', title: t('statTotalTags'),    value: stats.totalTags,         desc: t('statTotalTagsDesc') },
      { icon: ShieldCheck,     color: 'purple', title: t('statSecurity'),     value: `${stats.securityPercent}%`, desc: t('statSecurityDesc') },
    ];

    return (
      <div className="vault-stats">
        {statCards.map(({ icon: Icon, color, title, value, desc }) => (
          <div className="vault-stat-card" key={color}>
            <div className={`vault-stat-icon ${color}`}>
              <Icon size={30} />
            </div>
            <div>
              <div className="vault-stat-title">{title}</div>
              <div className="vault-stat-value">{value}</div>
              <div className="vault-stat-desc">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  );
}
