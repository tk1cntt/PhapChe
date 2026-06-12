'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChecklistPanelProps {
  locale?: string;
}

const CHECKLIST_ITEMS = {
  vi: [
    { title: 'Thông tin đối tác', description: 'Tên pháp lý, mã số thuế, địa chỉ, người đại diện.' },
    { title: 'Điều khoản thương mại', description: 'Chiết khấu, hoa hồng, doanh số, kỳ thanh toán.' },
    { title: 'Phạm vi đại lý', description: 'Khu vực, sản phẩm, quyền độc quyền hoặc không độc quyền.' },
    { title: 'Tài liệu liên quan', description: 'Báo giá, mẫu hợp đồng cũ, chính sách bán hàng nếu có.' },
  ],
  en: [
    { title: 'Partner Information', description: 'Legal name, tax code, address, representative.' },
    { title: 'Commercial Terms', description: 'Discounts, commissions, sales targets, payment terms.' },
    { title: 'Agency Scope', description: 'Region, products, exclusive or non-exclusive rights.' },
    { title: 'Related Documents', description: 'Quotations, old contracts, sales policies if any.' },
  ],
  zh: [
    { title: '合作伙伴信息', description: '法律名称、税号、地址、代表。' },
    { title: '商业条款', description: '折扣、佣金、销售目标、付款条款。' },
    { title: '代理范围', description: '地区、产品、独家或非独家权利。' },
    { title: '相关文件', description: '报价、旧合同、销售政策（若有）。' },
  ],
  ja: [
    { title: 'パートナー情報', description: '法人名、税番号、住所、担当者。' },
    { title: '商業条件', description: '割引、手数料、売上目標、支払条件。' },
    { title: '代理範囲', description: '地域、製品、独占または非独占の権利。' },
    { title: '関連書類', description: '見積書、古い契約書、販売方針（あれば）。' },
  ],
};

export default function ChecklistPanel({ locale = 'vi' }: ChecklistPanelProps) {
  const items = CHECKLIST_ITEMS[locale as keyof typeof CHECKLIST_ITEMS] || CHECKLIST_ITEMS.vi;
  const t = useTranslations('UserCreateRequest');

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
          {items.map((item) => (
            <div key={item.title} className="check-item">
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
