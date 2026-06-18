'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, Button, message, Alert } from 'antd';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: () => void;
}

export function InviteMembersModal({ isOpen, onClose, onInviteSent }: InviteMembersModalProps) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: { email: string; role: 'admin' | 'specialist' | 'viewer' }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/partner/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Gửi lời mời thất bại');
        return;
      }

      message.success('Đã gửi lời mời thành công!');
      form.resetFields();
      onInviteSent();
      onClose();
    } catch (err) {
      message.error('Đã xảy ra lỗi khi gửi lời mời');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Mời thành viên mới"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'specialist' }}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input placeholder="email@example.com" />
        </Form.Item>

        <Form.Item
          name="role"
          label="Vai trò"
          rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
        >
          <Select>
            <Select.Option value="admin">Admin - Quản trị viên</Select.Option>
            <Select.Option value="specialist">Specialist - Chuyên viên</Select.Option>
            <Select.Option value="viewer">Viewer - Người xem</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Gửi lời mời
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
