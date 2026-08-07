'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
// REMOVE: import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-legal-domains';

interface ChecklistPanelProps {
  selectedService?: string;
  locale?: string;
}

type ChecklistData = Record<string, Array<{ title: string; description: string }>>;

function getChecklist(data: ChecklistData, locale?: string): Array<{ title: string; description: string }> {
  if (locale && data[locale]) return data[locale];
  return data.vi;
}

// Default checklist items (for no service selected)
const DEFAULT_CHECKLIST = {
  vi: [
    { title: 'Xác định nhu cầu', description: 'Mô tả ngắn gọn vấn đề pháp lý cần hỗ trợ.' },
    { title: 'Chuẩn bị thông tin', description: 'Thu thập thông tin liên quan đến yêu cầu.' },
    { title: 'Liên hệ hỗ trợ', description: 'Nếu cần tư vấn nhanh, liên hệ hotline.' },
  ],
  en: [
    { title: 'Identify Needs', description: 'Briefly describe your legal support needs.' },
    { title: 'Prepare Information', description: 'Gather relevant information for your request.' },
    { title: 'Contact Support', description: 'For quick consultation, contact our hotline.' },
  ],
  ja: [
    { title: 'ニーズの特定', description: '法的サポートが必要な問題を簡潔に説明してください。' },
    { title: '情報の準備', description: 'リクエストに関連する情報を収集してください。' },
    { title: 'サポートに連絡', description: '迅速な相談が必要な場合は、ホットラインまでご連絡ください。' },
  ],
  zh: [
    { title: '明确需求', description: '简要描述需要法律支持的问题。' },
    { title: '准备信息', description: '收集与请求相关的信息。' },
    { title: '联系支持', description: '如需快速咨询，请联系热线。' },
  ],
};

// Dynamic checklist based on service type
const SERVICE_KEYS = ['agent-contract', 'labor-contract', 'trademark'] as const;
type ServiceKey = (typeof SERVICE_KEYS)[number];

const SERVICE_CHECKLISTS: Record<ServiceKey, Record<string, Array<{ title: string; description: string }>>> = {
  'agent-contract': {

const SERVICE_CHECKLISTS: Record<ServiceKey, Record<string, Array<{ title: string; description: string }>>> = {
  'agent-contract': {
      { title: 'Phạm vi đại lý', description: 'Khu vực, sản phẩm, quyền độc quyền hoặc không độc quyền.' },
      { title: 'Tài liệu liên quan', description: 'Báo giá, mẫu hợp đồng cũ, chính sách bán hàng nếu có.' },
    ],
    en: [
      { title: 'Partner Information', description: 'Legal name, tax code, address, representative.' },
      { title: 'Commercial Terms', description: 'Discounts, commissions, sales targets, payment terms.' },
      { title: 'Agency Scope', description: 'Region, products, exclusive or non-exclusive rights.' },
      { title: 'Related Documents', description: 'Quotations, old contracts, sales policies if any.' },
    ],
    ja: [
      { title: 'パートナー情報', description: '正式名、税コード、住所、代表者。' },
      { title: '商業条件', description: '割引、手数料、販売目標、支払条件。' },
      { title: '代理範囲', description: '地域、製品、独占的か非独占的か。' },
      { title: '関連書類', description: '見積書、過去の契約書、販売ポリシー（ある場合）。' },
    ],
    zh: [
      { title: '合作伙伴信息', description: '法定名称、税号、地址、代表人。' },
      { title: '商业条款', description: '折扣、佣金、销售目标、付款期限。' },
      { title: '代理范围', description: '区域、产品、独家或非独家权利。' },
      { title: '相关文件', description: '报价单、旧合同、销售政策（如有）。' },
    ],
  },
  'labor-contract': {
    vi: [
      { title: 'Thông tin nhân viên', description: 'Họ tên, vị trí, phòng ban, mức lương.' },
      { title: 'Điều khoản hợp đồng', description: 'Thời hạn, chế độ, nghĩa vụ các bên.' },
      { title: 'Tài liệu liên quan', description: 'Mô tả công việc, thỏa ước nội bộ nếu có.' },
    ],
    en: [
      { title: 'Employee Information', description: 'Name, position, department, salary.' },
      { title: 'Contract Terms', description: 'Duration, benefits, obligations of parties.' },
      { title: 'Related Documents', description: 'Job description, internal agreements if any.' },
    ],
    ja: [
      { title: '従業員情報', description: '氏名、役職、部署、給与。' },
      { title: '契約条件', description: '期間、福利厚生、当事者の義務。' },
      { title: '関連書類', description: '職務記述書、内部協定（ある場合）。' },
    ],
    zh: [
      { title: '员工信息', description: '姓名、职位、部门、薪资。' },
      { title: '合同条款', description: '期限、福利、各方义务。' },
      { title: '相关文件', description: '职位描述、内部协议（如有）。' },
    ],
  },
  'trademark': {
    vi: [
      { title: 'Thông tin nhãn hiệu', description: 'Tên nhãn hiệu, loại sản phẩm/dịch vụ.' },
      { title: 'Chủ sở hữu', description: 'Tên công ty hoặc cá nhân đứng tên.' },
      { title: 'Mẫu nhãn hiệu', description: 'Logo, hình ảnh nhãn hiệu (nếu có).' },
      { title: 'Tài liệu liên quan', description: 'Giấy phép kinh doanh, chứng nhận khác.' },
    ],
    en: [
      { title: 'Trademark Information', description: 'Trademark name, product/service types.' },
      { title: 'Owner', description: 'Company or individual name.' },
      { title: 'Trademark Sample', description: 'Logo, trademark image (if available).' },
      { title: 'Related Documents', description: 'Business license, other certificates.' },
    ],
    ja: [
      { title: '商標情報', description: '商標名、製品/サービスの種類。' },
      { title: '権利者', description: '会社名または個人名。' },
      { title: '商標サンプル', description: 'ロゴ、商標画像（ある場合）。' },
      { title: '関連書類', description: '営業許可証、その他の証明書。' },
    ],
    zh: [
      { title: '商标信息', description: '商标名称、产品/服务类型。' },
      { title: '权利人', description: '公司或个人名称。' },
      { title: '商标样本', description: '标志、商标图像（如有）。' },
      { title: '相关文件', description: '营业执照、其他证书。' },
    ],
  },
};

export default function ChecklistPanel({ selectedService, locale = 'vi' }: ChecklistPanelProps) {
  const t = useTranslations('CreateRequest');

  // Get dynamic checklist based on service
  let items: Array<{ title: string; description: string }>;

  if (selectedService && SERVICE_CHECKLISTS[selectedService]) {
    items = getChecklist(SERVICE_CHECKLISTS[selectedService], locale);
  } else {
    items = getChecklist(DEFAULT_CHECKLIST, locale);
  }

  return (
    <div className="side-card">
      <div className="card-header">
        <h3 className="card-title">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          {t('checklistTitle')}
        </h3>
      </div>

      <div className="card-body">
        <div className="check-list">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="check-item">
              <div className="check-dot"><Check size={13} /></div>
              <div>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
