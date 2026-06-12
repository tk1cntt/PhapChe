'use client';

import React from 'react';

export function ProfileForm(): React.ReactElement {
  return (
    <div className="profile-form">
      <div className="field-grid">
        <div className="field">
          <label htmlFor="fullName">Họ và tên</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            defaultValue="Mai Phương"
            placeholder="Nhập họ và tên"
          />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue="mai.phuong@anphat.vn"
            placeholder="Nhập email"
          />
        </div>

        <div className="field">
          <label htmlFor="phone">Số điện thoại</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue="+84 912 345 678"
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div className="field">
          <label htmlFor="title">Chức danh</label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue="Head of Legal Operations"
            placeholder="Nhập chức danh"
          />
        </div>

        <div className="field">
          <label htmlFor="workspace">Workspace mặc định</label>
          <select id="workspace" name="workspace" defaultValue="an-phat">
            <option value="an-phat">Công ty An Phát</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="timezone">Múi giờ</label>
          <select id="timezone" name="timezone" defaultValue="Asia/Ho_Chi_Minh">
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (ICT)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ProfileForm;
