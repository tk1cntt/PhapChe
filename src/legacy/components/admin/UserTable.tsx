'use client';

import React from 'react';
import UserRow from './UserRow';

interface User {
  name: string;
  initials: string;
  email: string;
  description: string;
  role: string;
  roleTitle: string;
  workspace: string;
  workspaceSlug: string;
  status: 'Active' | 'Invited' | 'Inactive';
  lastActive?: string;
  lastActiveTime?: string;
  avatarColor: 'green' | 'blue' | 'orange' | 'purple';
}

const sampleUsers: User[] = [
  {
    name: 'Alex Nguyen',
    initials: 'A',
    email: 'alex.nguyen@gitnexus.vn',
    description: 'Primary admin',
    role: 'super_admin',
    roleTitle: 'Super Admin',
    workspace: 'All workspaces',
    workspaceSlug: 'global-scope',
    status: 'Active',
    lastActive: '10/06/2026',
    lastActiveTime: '21:42 ICT',
    avatarColor: 'green',
  },
  {
    name: 'Hà Linh',
    initials: 'HL',
    email: 'ha.linh@gitnexus.vn',
    description: 'Specialist team',
    role: 'specialist',
    roleTitle: 'Legal Specialist',
    workspace: 'Công ty An Phát',
    workspaceSlug: 'an-phat',
    status: 'Active',
    lastActive: '10/06/2026',
    lastActiveTime: '20:15 ICT',
    avatarColor: 'blue',
  },
  {
    name: 'Quang Dũng',
    initials: 'QD',
    email: 'dung.quang@gitnexus.vn',
    description: 'Reviewer team',
    role: 'reviewer',
    roleTitle: 'Reviewer',
    workspace: 'Công ty Minh Khang',
    workspaceSlug: 'minh-khang',
    status: 'Active',
    lastActive: '10/06/2026',
    lastActiveTime: '18:30 ICT',
    avatarColor: 'orange',
  },
  {
    name: 'Minh Trang',
    initials: 'MT',
    email: 'minh.trang@gitnexus.vn',
    description: 'Operations',
    role: 'coordinator_admin',
    roleTitle: 'Coordinator Admin',
    workspace: 'Workspace nội bộ',
    workspaceSlug: 'internal',
    status: 'Active',
    lastActive: '09/06/2026',
    lastActiveTime: '16:45 ICT',
    avatarColor: 'purple',
  },
  {
    name: 'Mai Phương',
    initials: 'MP',
    email: 'mai.phuong@anphat.vn',
    description: 'Customer portal',
    role: 'customer',
    roleTitle: 'Customer',
    workspace: 'Công ty An Phát',
    workspaceSlug: 'an-phat',
    status: 'Active',
    lastActive: '09/06/2026',
    lastActiveTime: '12:20 ICT',
    avatarColor: 'blue',
  },
  {
    name: 'Trần Nam',
    initials: 'TN',
    email: 'nam.tran@minhkhang.vn',
    description: 'Customer portal',
    role: 'customer',
    roleTitle: 'Customer',
    workspace: 'Công ty Minh Khang',
    workspaceSlug: 'minh-khang',
    status: 'Invited',
    lastActive: 'Pending',
    lastActiveTime: 'Email sent 2 days ago',
    avatarColor: 'orange',
  },
  {
    name: 'Khánh An',
    initials: 'KA',
    email: 'khanh.an@gitnexus.vn',
    description: 'Audit control',
    role: 'audit_admin',
    roleTitle: 'Audit Admin',
    workspace: 'All workspaces',
    workspaceSlug: 'audit-scope',
    status: 'Active',
    lastActive: '08/06/2026',
    lastActiveTime: '09:10 ICT',
    avatarColor: 'green',
  },
  {
    name: 'Linh Anh',
    initials: 'LA',
    email: 'linh.anh@anphat.vn',
    description: 'Inactive customer',
    role: 'customer',
    roleTitle: 'Customer',
    workspace: 'Công ty An Phát',
    workspaceSlug: 'an-phat',
    status: 'Inactive',
    lastActive: '01/06/2026',
    lastActiveTime: 'Last login',
    avatarColor: 'purple',
  },
];

const UserTable: React.FC = () => {
  return (
    <div className="table-card">
      <div className="table-head">
        <div className="th"><span className="checkbox"></span></div>
        <div className="th">Name</div>
        <div className="th">Email</div>
        <div className="th">Role</div>
        <div className="th">Workspace</div>
        <div className="th">Status</div>
        <div className="th">Last Active</div>
        <div className="th">Action</div>
      </div>
      {sampleUsers.map((user, index) => (
        <UserRow key={index} user={user} />
      ))}
    </div>
  );
};

export default UserTable;
