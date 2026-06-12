import { redirect } from 'next/navigation';
import { Button, Card } from 'antd';
import { requireAppSession } from '@/lib/security/session';
import { createTemplateAction } from './actions';
import { VariableSchemaBuilder } from './variable-schema-builder';
import { prisma } from '@/lib/prisma';

const MATTER_TYPE_OPTIONS = [
  { key: 'labor_contract', label: 'Hợp đồng lao động' },
  { key: 'agency_contract', label: 'Hợp đồng đại lý' },
  { key: 'trademark_registration', label: 'Đăng ký nhãn hiệu' },
  { key: 'unsupported', label: 'Khác / Chưa rõ' },
];

export default async function NewTemplatePage() {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  return (
    <>
      <div className="mb-6">
        <a href="/admin/templates" className="text-[14px] font-medium text-[#0F766E] hover:underline">
          &larr; Quay lại danh sách mẫu tài liệu
        </a>
      </div>

      <Card>
        <h1 className="mb-6 text-[24px] font-semibold leading-[1.2]">Tạo mẫu tài liệu mới</h1>

        <form action={createTemplateAction} className="space-y-6">
          <input type="hidden" name="intent" value="create" />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="matterTypeKey" className="block text-[14px] font-semibold text-[#0F172A]">
                Loại vụ việc <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="matterTypeKey"
                name="matterTypeKey"
                required
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 text-[14px] text-[#0F172A] shadow-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-1"
              >
                <option value="">-- Chọn loại vụ việc --</option>
                {MATTER_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[13px] text-[#64748B]">Matter type key xác định loại vụ việc mẫu áp dụng.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="label" className="block text-[14px] font-semibold text-[#0F172A]">
                Tên mẫu <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="label"
                name="label"
                type="text"
                required
                placeholder="VD: Mẫu Hợp đồng lao động"
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 text-[14px] text-[#0F172A] shadow-sm placeholder:text-[#94A3B8] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-[14px] font-semibold text-[#0F172A]">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Mô tả ngắn về mẫu tài liệu này..."
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 text-[14px] text-[#0F172A] shadow-sm placeholder:text-[#94A3B8] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-1"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="content" className="block text-[14px] font-semibold text-[#0F172A]">
              Nội dung mẫu <span className="text-[#DC2626]">*</span>
            </label>
            <p className="text-[13px] text-[#64748B]">Dùng biến dạng <code className="rounded bg-[#F1F5F9] px-1 py-0.5 text-[12px]">{'{{variable_name}}'}</code> cho các trường cần điền khi sử dụng.</p>
            <textarea
              id="content"
              name="content"
              required
              rows={12}
              placeholder={`VD:\nCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nHỢP ĐỒNG LAO ĐỘNG\n\nCông ty: {{employer_name}}\nNhân viên: {{employee_name}}\nVị trí: {{job_title}}\nMức lương: {{salary}}\nNgày bắt đầu: {{start_date}}`}
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 font-mono text-[13px] leading-relaxed text-[#0F172A] shadow-sm placeholder:text-[#94A3B8] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-[#0F172A]">
              Biến mẫu
            </label>
            <p className="text-[13px] text-[#64748B]">Định nghĩa các biến sẽ được điền khi sử dụng mẫu này.</p>
            <VariableSchemaBuilder />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] pt-6">
            <a href="/admin/templates" className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#475569] shadow-sm hover:bg-[#F8FAFC]">
              Hủy
            </a>
            <Button type="primary" htmlType="submit">
              Tạo mẫu (Nháp)
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
