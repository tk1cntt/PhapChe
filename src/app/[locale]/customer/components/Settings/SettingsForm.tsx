'use client';

import React, { useState } from 'react';
import { ToggleRow } from './ToggleRow';
import { ProfileForm } from './ProfileForm';

export function SettingsForm(): React.ReactElement {
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
        <h3 className="section-title">Hồ sơ cá nhân</h3>
        <ProfileForm />
      </section>

      {/* Section 2: Notifications */}
      <section className="settings-section">
        <h3 className="section-title">Thông báo</h3>
        <div className="toggles-list">
          <ToggleRow
            label="Email khi chuyên viên phản hồi"
            description="Nhận email ngay khi chuyên viên phản hồi yêu cầu của bạn"
            defaultChecked={emailOnResponse}
          />
          <ToggleRow
            label="Nhắc SLA trước hạn"
            description="Nhận thông báo trước 24h khi có yêu cầu sắp hết hạn"
            defaultChecked={slaReminder}
          />
          <ToggleRow
            label="Tóm tắt hàng tuần"
            description="Nhận email tóm tắt các hồ sơ và hoạt động trong tuần"
            defaultChecked={weeklySummary}
          />
        </div>
      </section>

      {/* Section 3: Security */}
      <section className="settings-section">
        <h3 className="section-title">Bảo mật</h3>
        <div className="toggles-list">
          <ToggleRow
            label="Xác thực 2 bước"
            description="Yêu cầu mã xác thực khi đăng nhập từ thiết bị mới"
            defaultChecked={twoFactor}
          />
          <ToggleRow
            label="Thông báo đăng nhập lạ"
            description="Nhận thông báo khi có đăng nhập từ địa chỉ IP mới"
            defaultChecked={loginAlert}
          />
        </div>
        <button type="button" className="ghost-btn">
          Đổi mật khẩu
        </button>
      </section>
    </div>
  );
}

export default SettingsForm;
