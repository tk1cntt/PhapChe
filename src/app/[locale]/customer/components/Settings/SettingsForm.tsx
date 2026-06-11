'use client';

import React, { useState } from 'react';
import { ToggleRow } from './ToggleRow';
import { ProfileForm } from './ProfileForm';

export function SettingsForm(): JSX.Element {
  // Notification toggles
  const [emailOnResponse, setEmailOnResponse] = useState(true);
  const [slaReminder, setSlaReminder] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  // Security toggles
  const [twoFactor, setTwoFactor] = useState(true);
  const [loginAlert, setLoginAlert] = useState(true);

  return (
    <div className="settings-form">
      {/* Section 1: Profile */}
      <section className="settings-section">
        <h3 className="section-title">Ho so ca nhan</h3>
        <ProfileForm />
      </section>

      {/* Section 2: Notifications */}
      <section className="settings-section">
        <h3 className="section-title">Thong bao</h3>
        <div className="toggles-list">
          <ToggleRow
            label="Email khi chuyen vien phan hoi"
            description="Nhan email ngay khi chuyen vien phan hoi yeu cau cua ban"
            checked={emailOnResponse}
            onChange={setEmailOnResponse}
          />
          <ToggleRow
            label="Nhac SLA truoc han"
            description="Nhan thong bao truoc 24h khi co yeu cau sap het han"
            checked={slaReminder}
            onChange={setSlaReminder}
          />
          <ToggleRow
            label="Tom tat hang tuan"
            description="Nhan email tom tat cac ho so va hoat dong trong tuan"
            checked={weeklySummary}
            onChange={setWeeklySummary}
          />
        </div>
      </section>

      {/* Section 3: Security */}
      <section className="settings-section">
        <h3 className="section-title">Bao mat</h3>
        <div className="toggles-list">
          <ToggleRow
            label="Xac thuc 2 buoc"
            description="Yeu cau ma xac thuc khi dang nhap tu thiet bi moi"
            checked={twoFactor}
            onChange={setTwoFactor}
          />
          <ToggleRow
            label="Thong bao dang nhap la"
            description="Nhan thong bao khi co dang nhap tu dia chi IP moi"
            checked={loginAlert}
            onChange={setLoginAlert}
          />
        </div>
        <button type="button" className="ghost-btn">
          Doi mat khau
        </button>
      </section>
    </div>
  );
}
