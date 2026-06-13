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
  return (
    <div className='bg-white border rounded-[15px] p-5 mb-5' style={{borderColor:'var(--border)',boxShadow:'var(--soft-shadow)'}}>
      <div className='flex justify-between items-center gap-4'>
        <div className='flex items-center gap-3'>
          <div className='w-[370px] h-11 border rounded-lg flex items-center gap-3 px-3.5 text-[#718096] bg-white' style={{borderColor:'var(--border)'}}>
            <svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#718096' strokeWidth='2'><circle cx='11' cy='11' r='8'/><path d='m21 21-4.35-4.35'/></svg>
            <input type='text' placeholder={translations.searchPlaceholder || 'Tìm hồ sơ...'}
              className='border-0 outline-none flex-1 text-sm bg-transparent' onChange={e => onSearch?.(e.target.value)}/>
          </div>
          <button onClick={onFilter} className='h-11 border rounded-lg px-4 flex items-center gap-2.5 text-sm font-bold bg-white cursor-pointer' style={{borderColor:'var(--border)'}}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#0f172a' strokeWidth='2'><path d='M22 3H2l8 9.46V19l4 2v-8.54z'/></svg>
            {translations.filter || 'Bộ lọc'}
          </button>
          <button onClick={onFilter} className='h-11 border rounded-lg px-4 flex items-center gap-2.5 text-sm font-bold bg-white cursor-pointer' style={{borderColor:'var(--border)'}}>
            {translations.status || 'Trạng thái'} <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='#0f172a' strokeWidth='2'><path d='m6 9 6 6 6-6'/></svg>
          </button>
          {isSuperAdmin && workspaces.length > 0 && (
            <div className='relative' ref={ref}>
              <button onClick={() => setShowDD(!showDD)}
                className='h-11 border rounded-lg px-4 flex items-center gap-2.5 text-sm font-bold bg-white cursor-pointer' style={{borderColor:'var(--border)'}}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#0f172a' strokeWidth='2'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>
                <span className='max-w-[120px] truncate'>{selWS ? selWS.name : translations.allWorkspaces || 'Tất cả workspaces'}</span>
                <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='#0f172a' strokeWidth='2'><path d='m6 9 6 6 6-6'/></svg>
              </button>
              {showDD && (
                <div className='absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg z-50 py-1' style={{borderColor:'var(--border)'}}>
                  <button onClick={() => { onWorkspaceChange?.(null); setShowDD(false); }}
                    className='w-full px-4 py-2 text-left text-sm hover:bg-slate-50'>All workspaces</button>
                  {workspaces.map(ws => (
                    <button key={ws.id} onClick={() => { onWorkspaceChange?.(ws.id); setShowDD(false); }}
                      className={'w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ' + (selectedWorkspace === ws.id ? 'bg-teal-50 text-teal-700' : '')}>
                      <span className='font-medium'>{ws.name}</span>
                      <span className='ml-2 text-xs text-slate-400'>{ws.slug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <button onClick={onRefresh} className='w-[52px] h-11 border rounded-lg flex items-center justify-center bg-white cursor-pointer' style={{borderColor:'var(--border)'}}>
            <svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#0f172a' strokeWidth='2'><path d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'/><path d='M3 16v5h5'/><path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'/><path d='M21 8V3h-5'/></svg>
          </button>
          <button onClick={onExport} className='h-11 border rounded-lg px-4 flex items-center gap-2.5 text-sm font-bold bg-white cursor-pointer' style={{borderColor:'var(--border)'}}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#0f172a' strokeWidth='2'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>
            Export
          </button>
          <button className='h-11 border rounded-lg px-4 flex items-center gap-2.5 text-sm font-bold bg-white' style={{borderColor:'var(--border)'}}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#0f172a' strokeWidth='2'><rect x='3' y='3' width='7' height='7'/><rect x='14' y='3' width='7' height='7'/><rect x='14' y='14' width='7' height='7'/><rect x='3' y='14' width='7' height='7'/></svg>
            Cột hiển thị
          </button>
        </div>
      </div>
    </div>
  );
}