'use client';

interface Deadline {
  id: string;
  title: string;
  code: string;
  slaDeadline: string;
  progress: number;
  status: 'ok' | 'warn' | 'danger';
  timeText: string;
}

interface DeadlineSLAProps {
  deadlines: Deadline[];
}

const progressClass: Record<string, string> = {
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
};

export default function DeadlineSLA({ deadlines }: DeadlineSLAProps) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>Deadline & SLA</span>
        </div>
      </div>

      <div className="deadline-list">
        {deadlines.length === 0 ? (
          <div className="empty-state">Không có deadline nào trong tuần này</div>
        ) : (
          deadlines.map((d) => (
            <div key={d.id} className="deadline-item">
              <div className="deadline-top">
                <strong>{d.title}</strong>
                <span>{d.timeText}</span>
              </div>
              <div className="progress">
                <span
                  className={progressClass[d.status] || 'ok'}
                  style={{ width: `${d.progress}%` }}
                />
              </div>
              <p className="deadline-note">
                {d.status === 'danger' && 'Cần xử lý ngay'}
                {d.status === 'warn' && 'Sắp đến hạn'}
                {d.status === 'ok' && 'Còn thời gian'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
