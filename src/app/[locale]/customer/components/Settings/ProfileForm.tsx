'use client';

import React from 'react';

export function ProfileForm(): JSX.Element {
  return (
    <div className="profile-form">
      <div className="field-grid">
        <div className="field">
          <label htmlFor="fullName">Ho va ten</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            defaultValue="Mai Phuong"
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
          <label htmlFor="phone">So dien thoai</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue="+84 912 345 678"
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div className="field">
          <label htmlFor="title">Chuc danh</label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue="Head of Legal Operations"
            placeholder="Nhập chức danh"
          />
        </div>

        <div className="field">
          <label htmlFor="workspace">Workspace mac dinh</label>
          <select id="workspace" name="workspace" defaultValue="an-phat">
            <option value="an-phat">Cong ty An Phat</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="timezone">Mui gio</label>
          <select id="timezone" name="timezone" defaultValue="Asia/Ho_Chi_Minh">
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (ICT)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
