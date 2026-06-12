'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChecklistPanelProps {
  locale?: string;
}

const CHECKLIST_ITEMS = {
  vi: [
    {
      title: 'Thông tin đối tác',
      description: 'Tên pháp lý, mã số thuế, địa chỉ, người đại diện.',
    },
    {
      title: 'Điều khoản thương mại',
      description: 'Chiết khấu, hoa hồng, doanh số, kỳ thanh toán.',
    },
    {
      title: 'Phạm vi đại lý',
      description: 'Khu vực, sản phẩm, quyền độc quyền hoặc không độc quyền.',
    },
    {
      title: 'Tài liệu liên quan',
      description: 'Báo giá, mẫu hợp đồng cũ, chính sách bán hàng nếu có.',
    },
  ],
  en: [
    {
      title: 'Partner Information',
      description: 'Legal name, tax code, address, representative.',
    },
    {
      title: 'Commercial Terms',
      description: 'Discounts, commissions, sales targets, payment terms.',
    },
    {
      title: 'Agency Scope',
      description: 'Region, products, exclusive or non-exclusive rights.',
    },
    {
      title: 'Related Documents',
      description: 'Quotations, old contracts, sales policies if any.',
    },
  ],
  zh: [
    {
      title: '合作伙伴信息',
      description: '法律名称、税号、地址、代表。',
    },
    {
      title: '商业条款',
      description: '折扣佣釐销售目标付款条款。',
    },
    {
      title: '代理范围',
      description: '地区产品独家或非独家权利。',
    },
    {
      title: '相关文件',
      description: '报价旧合同销售政策（若有）。',
    },
  ],
  ja: [
    {
      title: 'パートナー情報',
      description: '法人名、税号住所担当者。',
    },
    {
      title: '商業条件',
      description: '配料口銭売上目標支払条件。',
    },
    {
      title: '代理範囲',
      description: '地域製品独占与非独占権利。',
    },
    {
      title: '関連書類',
      description: '見積書古い契約書販売方針（あれば）。',
    },
  ],
};

export default function ChecklistPanel({ locale = 'vi' }: ChecklistPanelProps) {
  const items = CHECKLIST_ITEMS[locale as keyof typeof CHECKLIST_ITEMS] || CHECKLIST_ITEMS.vi;
  const t = useTranslations('UserCreateRequest');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-200">
        <div className="text-teal-700">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">{t('checklistTitle')}</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.title} className="flex gap-3 items-start">
              {/* Check icon */}
              <div className="w-[22px] h-[22px] rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                <Check size={13} />
              </div>
              
              {/* Text */}
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
