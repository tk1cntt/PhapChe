'use client';

import Link from 'next/link';

interface ProcessingCase {
  id: string;
  code: string;
  title: string;
  status: string;
  statusLabel: string;
  assignee: string;
  assigneeRole: string;
}

interface DeadlineItem {
  title: string;
  timeLeft: string;
  progress: number;
  variant: 'ok' | 'warn' | 'danger';
  note: string;
}

interface DocumentItem {
  name: string;
  ext: string;
  size: string;
  date: string;
}

interface TimelineItem {
  title: string;
  description: string;
  time: string;
}

interface TableRow {
  code: string;
  codeStatus: string;
  codeStatusLabel: string;
  type: string;
  typeEn: string;
  status: string;
  statusLabel: string;
  assignee: string;
  assigneeRole: string;
  date: string;
  time: string;
}

interface DashboardClientProps {
  stats: {
    total: number;
    processing: number;
    completed: number;
    vaultFiles: number;
  };
  processingCases: ProcessingCase[];
  deadlineItems: DeadlineItem[];
  documentItems: DocumentItem[];
  timelineItems: TimelineItem[];
  tableData: TableRow[];
  translations: Record<string, string>;
  workspaceSlug: string;
}

function getStatusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    intake_submitted: 'orange',
    in_progress: 'blue',
    pending_review: 'blue',
    revision_required: 'orange',
    delivered: 'green',
    closed: 'green',
    cancelled: 'red',
  };
  return map[status] ?? 'blue';
}

function getActionText(status: string, t: Record<string, string>): string {
  switch (status) {
    case 'pending_review':
    case 'revision_required':
      return t.responseAction;
    case 'delivered':
    case 'closed':
      return t.downloadAction;
    case 'in_progress':
      return t.viewDetailAction;
    default:
      return t.openAction;
  }
}

export function DashboardClient({
  stats,
  processingCases,
  deadlineItems,
  documentItems,
  timelineItems,
  tableData,
  translations: t,
  workspaceSlug,
}: DashboardClientProps) {
  return (
    <div className="user-dashboard-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>{t.greeting}</h1>
          <p className="subtitle">{t.greetingDesc}</p>
        </div>
        <Link href={`/${workspaceSlug}/create`} className="create-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          {t.createNewRequest}
        </Link>
      </div>

      {/* Welcome Card */}
      <div className="welcome-card">
        <div className="welcome-left">
          <div className="welcome-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2>{t.welcomeTitle}</h2>
            <p>{t.welcomeDesc}</p>
          </div>
        </div>
        <div className="quick-actions">
          <button className="ghost-btn">{t.viewDocuments}</button>
          <button className="create-btn">{t.sendReply}</button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div>
            <div className="stat-title">{t.statTotalRequests}</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-desc">{t.statTotalRequestsDesc}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <div className="stat-title">{t.statProcessing}</div>
            <div className="stat-value">{stats.processing}</div>
            <div className="stat-desc">{t.statProcessingDesc}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <div className="stat-title">{t.statCompleted}</div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-desc">{t.statCompletedDesc}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h18v13H3z" />
              <path d="M3 7l3-4h12l3 4" />
            </svg>
          </div>
          <div>
            <div className="stat-title">{t.statVaultFiles}</div>
            <div className="stat-value">{stats.vaultFiles}</div>
            <div className="stat-desc">{t.statVaultFilesDesc}</div>
          </div>
        </div>
      </div>

      {/* Grid-2: Processing Cases + Deadline/SLA */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              {t.processingCases}
            </div>
            <Link href={`/${workspaceSlug}/cases`} className="small-link">{t.viewAll}</Link>
          </div>
          <div className="case-list">
            {processingCases.length === 0 ? (
              <p style={{ color: '#64748b', padding: 16 }}>{t.noData}</p>
            ) : (
              processingCases.map((c) => (
                <div key={c.id} className="case-item">
                  <div className="case-main">
                    <div className="case-icon">📄</div>
                    <div className="case-info">
                      <strong>{c.code}</strong>
                      <span>{c.title}</span>
                    </div>
                  </div>
                  <div className="stack">
                    <strong>{c.assignee}</strong>
                    <span>{c.assigneeRole}</span>
                  </div>
                  <div><span className={`badge ${getStatusBadgeColor(c.status)}`}>{c.statusLabel}</span></div>
                  <div><Link href={`/${workspaceSlug}/cases`} className="action-link">{t.viewDetail}</Link></div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {t.deadlineSla}
            </div>
          </div>
          <div className="deadline-list">
            {deadlineItems.length === 0 ? (
              <p style={{ color: '#64748b', padding: 16 }}>{t.noData}</p>
            ) : (
              deadlineItems.map((d, i) => (
                <div key={i} className="deadline-item">
                  <div className="deadline-top">
                    <strong>{d.title}</strong>
                    <span>{d.timeLeft}</span>
                  </div>
                  <div className="progress"><span className={d.variant} style={{ width: `${d.progress}%` }} /></div>
                  <p className="deadline-note">{d.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grid-2: Recent Documents + Recent Activity */}
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h18v13H3z" />
                <path d="M3 7l3-4h12l3 4" />
              </svg>
              {t.recentDocuments}
            </div>
            <span className="small-link">{t.openVault}</span>
          </div>
          <div className="document-list">
            {documentItems.length === 0 ? (
              <p style={{ color: '#64748b', padding: 16 }}>{t.noData}</p>
            ) : (
              documentItems.map((d, i) => (
                <div key={i} className="document-item">
                  <div className="document-left">
                    <div className="file-icon">{d.ext}</div>
                    <div className="file-info">
                      <strong>{d.name}</strong>
                      <span>{d.size} · {t.colUpdatedAt} {d.date}</span>
                    </div>
                  </div>
                  <span className="badge green">🔒</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <div className="panel-title-left">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {t.recentActivity}
            </div>
          </div>
          <div className="timeline">
            {timelineItems.length === 0 ? (
              <p style={{ color: '#64748b', padding: 16 }}>{t.noData}</p>
            ) : (
              timelineItems.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" />
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <div className="timeline-time">{item.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar">
          <div className="left-tools">
            <div className="request-search">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input placeholder={t.searchPlaceholder} />
            </div>
            <button className="tool-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
              </svg>
              {t.filter}
            </button>
            <button className="tool-btn">
              {t.status}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
          <div className="right-tools">
            <button className="tool-btn square">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 16v5h5" />
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 8V3h-5" />
              </svg>
            </button>
            <button className="tool-btn">{t.export}</button>
            <button className="tool-btn">{t.columns}</button>
          </div>
        </div>
      </div>

      {/* Request Table */}
      <div className="table-card">
        <div className="table-head">
          <div className="th">{t.colCode}</div>
          <div className="th">{t.colType}</div>
          <div className="th">{t.colStatus}</div>
          <div className="th">{t.colAssignee}</div>
          <div className="th">{t.colUpdatedAt}</div>
          <div className="th">{t.colAction}</div>
        </div>
        {tableData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>{t.noData}</div>
        ) : (
          tableData.map((row, i) => (
            <div key={i} className="table-row">
              <div className="td">
                <div className="case-main">
                  <div className="case-icon">📄</div>
                  <div className="case-info">
                    <strong>{row.code}</strong>
                    <span>{row.codeStatusLabel}</span>
                  </div>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{row.type}</strong>
                  <span>{row.typeEn}</span>
                </div>
              </div>
              <div className="td"><span className={`badge ${getStatusBadgeColor(row.status)}`}>{row.statusLabel}</span></div>
              <div className="td">
                <div className="stack">
                  <strong>{row.assignee}</strong>
                  <span>{row.assigneeRole}</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{row.date}</strong>
                  <span>{row.time}</span>
                </div>
              </div>
              <div className="td"><Link href={`/${workspaceSlug}/cases`} className="action-link">{getActionText(row.status, t)}</Link></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
