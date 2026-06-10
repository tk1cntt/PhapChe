'use client';

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="header-row">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">
            Welcome to GitNexus Legal admin panel.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div className="stat-title">Total Users</div>
            <div className="stat-value">0</div>
            <div className="stat-desc">Across all workspaces</div>
          </div>
          <div className="info">i</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div>
            <div className="stat-title">Active Users</div>
            <div className="stat-value">0</div>
            <div className="stat-desc">0% of total users</div>
          </div>
          <div className="info">i</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18"/>
              <path d="M5 21V7h6v14"/>
              <path d="M13 21V3h6v18"/>
              <path d="M7 10h2M7 14h2M7 18h2"/>
              <path d="M15 6h2M15 10h2M15 14h2M15 18h2"/>
            </svg>
          </div>
          <div>
            <div className="stat-title">Workspaces</div>
            <div className="stat-value">0</div>
            <div className="stat-desc">Total workspaces</div>
          </div>
          <div className="info">i</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16v16H4z"/>
              <path d="m22 6-10 7L2 6"/>
            </svg>
          </div>
          <div>
            <div className="stat-title">Pending Requests</div>
            <div className="stat-value">0</div>
            <div className="stat-desc">Awaiting processing</div>
          </div>
          <div className="info">i</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="table-card">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Quick Actions
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button className="create-btn">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6"/>
              <path d="M23 11h-6"/>
            </svg>
            Create User
          </button>
          <button className="create-btn">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M12 18v-6"/>
              <path d="M9 15h6"/>
            </svg>
            New Request
          </button>
        </div>
      </div>
    </div>
  );
}
