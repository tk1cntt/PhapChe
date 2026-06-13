'use client';
import { useState, useRef, useEffect } from 'react';
interface Workspace { id: string; name: string; slug: string; }
interface AdminToolbarProps {
  onSearch?: (q: string) => void; onFilter?: () => void; onExport?: () => void; onRefresh?: () => void;
  onWorkspaceChange?: (id: string | null) => void; workspaces?: Workspace[]; selectedWorkspace?: string | null;
  isSuperAdmin?: boolean; translations?: Record<string, string>;
}
export default function AdminToolbar({ onSearch, onFilter, onExport, onRefresh,
  onWorkspaceChange, workspaces = [], selectedWorkspace = null, isSuperAdmin = false, translations = {}}
: AdminToolbarProps) {
  const [showDD, setShowDD] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowDD(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const selWS = workspaces.find(w => w.id === selectedWorkspace);
  const toolButtonStyle = {
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
  };

  return (
    <div
      data-testid="admin-requests-toolbar"
      className="toolbar-card"
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
        className="toolbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div className="left-tools" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            data-testid="admin-requests-search"
            className="request-search"
            style={{
              width: 330,
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
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder={translations.searchPlaceholder || 'Tìm hồ sơ, khách hàng, workspace...'}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }}
              onChange={e => onSearch?.(e.target.value)}
            />
          </div>

          <button onClick={onFilter} className="tool-btn" style={toolButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>
            {translations.filter || 'Bộ lọc'}
          </button>

          <button onClick={onFilter} className="tool-btn" style={toolButtonStyle}>
            {translations.status || 'Trạng thái'}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <div className="relative" ref={ref}>
            <button onClick={() => setShowDD(!showDD)} className="tool-btn" style={toolButtonStyle}>
              <span className="max-w-[120px] truncate">{selWS ? selWS.name : translations.workspace || 'Workspace'}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {showDD && workspaces.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg z-50 py-1" style={{ borderColor: '#dfe7f1' }}>
                <button onClick={() => { onWorkspaceChange?.(null); setShowDD(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50">
                  {translations.allWorkspaces || 'Tất cả workspaces'}
                </button>
                {workspaces.map(ws => (
                  <button key={ws.id} onClick={() => { onWorkspaceChange?.(ws.id); setShowDD(false); }} className={'w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ' + (selectedWorkspace === ws.id ? 'bg-teal-50 text-teal-700' : '')}>
                    <span className="font-medium">{ws.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{ws.slug}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="right-tools" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onRefresh} className="tool-btn square" style={{ ...toolButtonStyle, width: 52, padding: 0, justifyContent: 'center' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2"><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 16v5h5"/><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 8V3h-5"/></svg>
          </button>

          <button onClick={onExport} className="tool-btn" style={toolButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
            {translations.export || 'Export'}
          </button>

          <button className="tool-btn" style={toolButtonStyle}>
            {translations.columns || 'Cột hiển thị'}
          </button>
        </div>
      </div>
    </div>
  );
}