'use client';

import type { ReactNode } from 'react';
import { Tag, Button, Card, Typography, Flex } from 'antd';
import type { MatterCatalogItem } from '@/lib/intake/catalog';

type UploadedFile = { filename: string; size: number };
type Answer = { key: string; label: string; value: string };

export function IntakeShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">{children}</main>;
}

export function IntakeHeader() {
  return (
    <Flex vertical gap={4} style={{ marginBottom: 16 }}>
      <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
        Gửi yêu cầu pháp lý
      </Typography.Title>
      <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
        Trả lời vài câu hỏi để chuyên viên có đủ thông tin tiếp nhận hồ sơ.
      </Typography.Paragraph>
    </Flex>
  );
}

export function ProgressSteps({ activeStep }: { activeStep: number }) {
  const steps = ['Dịch vụ', 'Câu hỏi', 'Tài liệu', 'Kiểm tra'];
  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {steps.map((step, index) => {
        const active = index <= activeStep;
        return (
          <li key={step} className={`min-h-10 rounded-xl border px-4 py-2 text-[14px] font-semibold leading-[1.4] ${active ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'}`}>
            {index + 1}. {step}
          </li>
        );
      })}
    </ol>
  );
}

export function ServiceSelection({ catalog }: { catalog: readonly MatterCatalogItem[] }) {
  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Bạn cần hỗ trợ việc gì?</h2>
        <p className="text-[16px] leading-[1.5] text-[#475569]">Chọn một nhóm dịch vụ để bắt đầu tạo hồ sơ nháp.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {catalog.map((item, index) => (
          <label key={item.key} className="cursor-pointer rounded-2xl border border-[#E2E8F0] bg-white p-4 transition hover:bg-[#F8FAFC] focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:ring-offset-2">
            <input className="sr-only" type="radio" name="matterTypeKey" value={item.key} defaultChecked={index === 0} />
            <span className="block text-[16px] font-semibold leading-[1.5] text-[#0F172A]">{item.label}</span>
            <span className="mt-2 block text-[14px] leading-[1.4] text-[#475569]">{item.description}</span>
          </label>
        ))}
      </div>
      <Button type="primary" htmlType="submit">Tiếp tục</Button>
    </Card>
  );
}

export function QuestionStep({ matterType }: { matterType: MatterCatalogItem }) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Thông tin cần cung cấp</h2>
          <p className="text-[16px] leading-[1.5] text-[#475569]">{matterType.label}</p>
        </div>
        {matterType.key === 'unsupported' ? <Tag color="orange">Hồ sơ sẽ được chuyển để chuyên viên phân loại trước khi xử lý.</Tag> : null}
      </div>
      <div className="space-y-4">
        {matterType.questions.map((question) => (
          <label key={question.key} className="block space-y-2 text-[14px] font-semibold leading-[1.4] text-[#0F172A]">
            <span>{question.label}{question.required ? ' *' : ''}</span>
            {question.type === 'textarea' ? (
              <textarea name={`answer.${question.key}`} required={question.required} className="min-h-28 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
            ) : (
              <input name={`answer.${question.key}`} required={question.required} className="min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
            )}
          </label>
        ))}
      </div>
      <p className="text-[14px] leading-[1.4] text-[#DC2626]">Vui lòng điền thông tin bắt buộc trước khi tiếp tục.</p>
      <Button type="primary" htmlType="submit">Lưu câu trả lời</Button>
    </Card>
  );
}

export function UploadStep({ files }: { files: UploadedFile[] }) {
  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Tài liệu hỗ trợ</h2>
        <p className="text-[16px] leading-[1.5] text-[#475569]">Tải lên hợp đồng, giấy phép, email trao đổi hoặc tài liệu liên quan. Không cần OCR ở bước này.</p>
      </div>
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6 text-center focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:ring-offset-2">
        <span className="text-[16px] font-semibold leading-[1.5] text-[#0F172A]">Chọn tệp đính kèm</span>
        <input className="mt-4" type="file" name="file" />
      </label>
      <p className="text-[14px] leading-[1.4] text-[#475569]">Tệp được lưu riêng tư theo hồ sơ và không tạo đường dẫn công khai.</p>
      <FileList files={files} />
      <Button type="primary" htmlType="submit">Tải tệp lên</Button>
    </Card>
  );
}

export function ReviewSummary({ matterType, answers, files }: { matterType: MatterCatalogItem; answers: Answer[]; files: UploadedFile[] }) {
  return (
    <Card className="space-y-4">
      <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Kiểm tra trước khi gửi</h2>
      <div className="rounded-xl border border-[#E2E8F0] p-4">
        <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Loại việc</p>
        <p className="text-[16px] leading-[1.5] text-[#0F172A]">{matterType.label}</p>
      </div>
      <div className="space-y-3">
        {answers.map((answer) => (
          <div key={answer.key} className="rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">{answer.label}</p>
            <p className="text-[16px] leading-[1.5] text-[#0F172A]">{answer.value}</p>
          </div>
        ))}
      </div>
      <FileList files={files} />
      <p className="text-[14px] leading-[1.4] text-[#475569]">Tệp được lưu riêng tư theo hồ sơ và không tạo đường dẫn công khai.</p>
      <Button type="primary" htmlType="submit">Gửi yêu cầu</Button>
    </Card>
  );
}

function FileList({ files }: { files: UploadedFile[] }) {
  if (files.length === 0) return <p className="text-[14px] leading-[1.4] text-[#475569]">Chưa có tệp đính kèm.</p>;
  return (
    <ul className="space-y-2">
      {files.map((file) => (
        <li key={`${file.filename}-${file.size}`} className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] leading-[1.4] text-[#0F172A]">
          {file.filename} · {formatFileSize(file.size)}
        </li>
      ))}
    </ul>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  return `${Math.round(size / 1024)} KB`;
}
