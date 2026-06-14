'use client';

interface Case {
  id: string;
  code: string;
  title: string;
  matterType: string;
  status: string;
  statusVariant: string;
  statusText: string;
  assignee: string;
  assigneeRole: string;
  updatedAt: string;
}

interface RecentCasesProps {
  cases: Case[];
}

const statusBadgeClass: Record<string, string> = {
  green: 'badge green',
  blue: 'badge blue',
  orange: 'badge orange',
  red: 'badge red',
  purple: 'badge purple',
};

export default function RecentCases({ cases }: RecentCasesProps) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span>Hồ sơ đang xử lý</span>
        </div>
        <a className="small-link" href="#">Xem tất cả →</a>
      </div>

      <div className="case-list">
        {cases.length === 0 ? (
          <div className="empty-state">Không có hồ sơ nào đang xử lý</div>
        ) : (
          cases.map((c) => (
            <div key={c.id} className="case-item">
              <div className="case-main">
                <div className="case-icon">📄</div>
                <div className="case-info">
                  <strong>{c.code}</strong>
                  <span>{c.title}</span>
                </div>
              </div>
              <div className="case-assignee">
                <strong>{c.assignee}</strong>
                <span>{c.assigneeRole}</span>
              </div>
              <div>
                <span className={statusBadgeClass[c.statusVariant] || 'badge blue'}>
                  {c.statusText}
                </span>
              </div>
              <div>
                <a className="action-link" href="#">Mở →</a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
