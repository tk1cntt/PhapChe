'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-legal-domains';

interface ChecklistPanelProps {
  selectedService?: string;
  locale?: string;
}

// Default checklist items (for no service selected)
const DEFAULT_CHECKLIST = {
  vi: [
    { title: 'Xac dinh nhu cau', description: 'Mo ta ngan gon van de phap ly can ho tro.' },
    { title: 'Chuan bi thong tin', description: 'Thu thap thong tin lien quan den yeu cau.' },
    { title: 'Lien he ho tro', description: 'Neu can tu van nhanh, lien he hotline.' },
  ],
  en: [
    { title: 'Identify Needs', description: 'Briefly describe your legal support needs.' },
    { title: 'Prepare Information', description: 'Gather relevant information for your request.' },
    { title: 'Contact Support', description: 'For quick consultation, contact our hotline.' },
  ],
};

// Dynamic checklist based on service type
const SERVICE_CHECKLISTS: Record<string, Record<string, Array<{ title: string; description: string }>>> = {
  'agent-contract': {
    vi: [
      { title: 'Thong tin doi tac', description: 'Ten phap ly, ma so thue, dia chi, nguoi dai dien.' },
      { title: 'Dieu khoan thuong mai', description: 'Chiet khau, hoa hong, doanh so, ky thanh toan.' },
      { title: 'Pham vi dai ly', description: 'Khu vuc, san pham, quyen doc quyen hoac khong doc quyen.' },
      { title: 'Tai lieu lien quan', description: 'Bao gia, mau hop dong cu, chinh sach ban hang neu co.' },
    ],
    en: [
      { title: 'Partner Information', description: 'Legal name, tax code, address, representative.' },
      { title: 'Commercial Terms', description: 'Discounts, commissions, sales targets, payment terms.' },
      { title: 'Agency Scope', description: 'Region, products, exclusive or non-exclusive rights.' },
      { title: 'Related Documents', description: 'Quotations, old contracts, sales policies if any.' },
    ],
  },
  'labor-contract': {
    vi: [
      { title: 'Thong tin nhan vien', description: 'Ho ten, vi tri, phong ban, muc luong.' },
      { title: 'Dieu khoan hop dong', description: 'Thoi han, che do, nghia vu cac ben.' },
      { title: 'Tai lieu lien quan', description: 'Mo ta cong viec, thoa uoc noi bo neu co.' },
    ],
    en: [
      { title: 'Employee Information', description: 'Name, position, department, salary.' },
      { title: 'Contract Terms', description: 'Duration, benefits, obligations of parties.' },
      { title: 'Related Documents', description: 'Job description, internal agreements if any.' },
    ],
  },
  'trademark': {
    vi: [
      { title: 'Thong tin nhan hieu', description: 'Ten nhan hieu, loai san pham/dich vu.' },
      { title: 'Chu so huu', description: 'Ten cong ty hoac ca nhan dung ten.' },
      { title: 'Mau nhan hieu', description: 'Logo, hinh anh nhan hieu (neu co).' },
      { title: 'Tai lieu lien quan', description: 'Giay phep kinh doanh, chung nhan khac.' },
    ],
    en: [
      { title: 'Trademark Information', description: 'Trademark name, product/service types.' },
      { title: 'Owner', description: 'Company or individual name.' },
      { title: 'Trademark Sample', description: 'Logo, trademark image (if available).' },
      { title: 'Related Documents', description: 'Business license, other certificates.' },
    ],
  },
};

export default function ChecklistPanel({ selectedService, locale = 'vi' }: ChecklistPanelProps) {
  const t = useTranslations('UserCreateRequest');

  // Get dynamic checklist based on service
  let items: Array<{ title: string; description: string }>;

  if (selectedService && SERVICE_CHECKLISTS[selectedService]) {
    items = SERVICE_CHECKLISTS[selectedService][locale] || SERVICE_CHECKLISTS[selectedService].vi;
  } else {
    items = DEFAULT_CHECKLIST[locale] || DEFAULT_CHECKLIST.vi;
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
