'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  userInitial?: string;
  onSearch?: (value: string) => void;
}

export default function Topbar({
  title,
  subtitle,
  breadcrumbs = [],
  userInitial = 'A',
  onSearch
}: TopbarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      if (onSearch) {
        onSearch(searchValue);
      } else {
        router.push(`/vi/admin/users?search=${encodeURIComponent(searchValue)}&page=1`);
      }
    }
  };

  return (
    <header className="topbar">
      {/* Left: Title or Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {title ? (
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#152238' }}>{title}</h1>
            {subtitle && <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>{subtitle}</p>}
          </div>
        ) : (
          <div className="breadcrumb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 11l9-8 9 8"/>
              <path d="M5 10v10h14V10"/>
              <path d="M9 20v-6h6v6"/>
            </svg>
            {breadcrumbs.map((item, index) => (
              <span key={index}>
                <span>/</span>
                {item.href ? (
                  <a href={item.href} style={{ color: index === breadcrumbs.length - 1 ? '#152238' : '#475569', fontWeight: index === breadcrumbs.length - 1 ? 600 : 400 }}>{item.label}</a>
                ) : (
                  <strong style={{ color: '#152238' }}>{item.label}</strong>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: Search, Language, Bell, Avatar */}
      <div className="top-actions">
        {/* Search */}
        <div className="search-top">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        {/* Language */}
        <div className="lang">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          us English
        </div>

        {/* Notifications */}
        <div className="icon-btn" style={{ width: 45, border: 'none', background: 'transparent' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        {/* Avatar */}
        <div className="circle">{userInitial}</div>
      </div>
    </header>
  );
}
