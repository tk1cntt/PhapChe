'use client';

import { Modal, Alert, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface RoleChangeDialogProps {
  isOpen: boolean;
  currentRole: string;
  newRole: string;
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin - Quản trị viên',
  specialist: 'Specialist - Chuyên viên',
  viewer: 'Viewer - Người xem',
};

const roleDescriptions: Record<string, string> = {
  admin: 'Có quyền quản lý thành viên, xem và quản lý yêu cầu, tài liệu',
  specialist: 'Có quyền xem và quản lý yêu cầu, tài liệu',
  viewer: 'Chỉ có quyền xem yêu cầu và tài liệu',
};

export function RoleChangeDialog({
  isOpen,
  currentRole,
  newRole,
  memberName,
  onConfirm,
  onCancel,
  isLoading,
}: RoleChangeDialogProps) {
  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          Xác nhận đổi vai trò
        </Space>
      }
      open={isOpen}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={isLoading}
      okButtonProps={{ danger: currentRole === 'admin' && newRole !== 'admin' }}
    >
      <div className="py-4">
        <p className="mb-4">
          Bạn có chắc chắn muốn đổi vai trò của <strong>{memberName}</strong>?
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500">Vai trò hiện tại:</span>
            <span className="font-medium">{roleLabels[currentRole]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Vai trò mới:</span>
            <span className="font-medium text-blue-600">{roleLabels[newRole]}</span>
          </div>
        </div>

        <Alert
          type="warning"
          showIcon
          message="Thay đổi quyền hạn"
          description={
            <div className="mt-2">
              <p className="mb-2">
                Sau khi đổi vai trò, {memberName} sẽ{' '}
                {newRole === 'viewer' ? 'mất quyền quản lý yêu cầu và thành viên' : 'có thêm quyền quản lý'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Quyền mới:</strong> {roleDescriptions[newRole]}
              </p>
            </div>
          }
        />
      </div>
    </Modal>
  );
}
