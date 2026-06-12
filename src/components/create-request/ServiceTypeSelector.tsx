'use client';

import { useTranslations } from 'next-intl';
import ServiceCard, { ServiceOption } from './ServiceCard';

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: 'agent-contract',
    title: {
      vi: 'Soạn hợp đồng đại lý',
      en: 'Draft Agency Contract',
      zh: '起草代理合同',
      ja: '代理契約書の作成',
    },
    description: {
      vi: 'Chuẩn hóa thông tin đối tác, chiết khấu, điều khoản thanh toán, thời hạn hợp đồng và phạm vi phân phối.',
      en: 'Standardize partner info, discounts, payment terms, contract duration, and distribution scope.',
      zh: '标准化合作伙伴信息、折扣、付款条款、合同期限和分销范围。',
      ja: 'パートナー情報、割引、支払条件、契約期間、流通範囲の標準化。',
    },
    tags: [
      { label: { vi: 'Khuyến nghị', en: 'Recommended', zh: '推荐', ja: 'おすすめ' }, variant: 'green' },
    ],
    estimatedTime: {
      vi: '2-3 ngày',
      en: '2-3 days',
      zh: '2-3天',
      ja: '2〜3日',
    },
  },
  {
    id: 'labor-contract',
    title: {
      vi: 'Soạn hợp đồng lao động',
      en: 'Draft Labor Contract',
      zh: '起草劳动合同',
      ja: '雇用契約書の作成',
    },
    description: {
      vi: 'Ghi nhận vị trí, lương, thời hạn, điều kiện làm việc, bảo mật thông tin và điều khoản chấm dứt.',
      en: 'Record position, salary, duration, working conditions, confidentiality, and termination terms.',
      zh: '记录职位、薪资、期限、工作条件、保密信息和终止条款。',
      ja: '職種、給与、期間、勤務条件、機密情報、終了条件の記録。',
    },
    tags: [
      { label: { vi: 'Nhanh', en: 'Fast', zh: '快速', ja: '快速' }, variant: 'blue' },
    ],
  },
  {
    id: 'trademark',
    title: {
      vi: 'Đăng ký nhãn hiệu',
      en: 'Register Trademark',
      zh: '注册商标',
      ja: ' Trademark registration',
    },
    description: {
      vi: 'Thu thập tên nhãn hiệu, nhóm sản phẩm/dịch vụ, chủ sở hữu, mẫu nhãn và phạm vi đăng ký.',
      en: 'Collect trademark name, product/service group, owner, sample, and registration scope.',
      zh: '收集商标名称、产品/服务组、所有者、样本和注册范围。',
      ja: ' Trademark名、製品/サービスグループ所有者、サンプル、登録範囲の収集。',
    },
    tags: [
      { label: { vi: 'IP', en: 'IP', zh: '知识产权', ja: 'IP' }, variant: 'purple' },
    ],
  },
  {
    id: 'nda',
    title: {
      vi: 'Rà soát hợp đồng / NDA',
      en: 'Review Contract / NDA',
      zh: '审核合同/保密协议',
      ja: '契約/NDAレビュー',
    },
    description: {
      vi: 'Chuyên viên kiểm tra rủi ro pháp lý, điều khoản bất lợi, nghia vụ thanh toán, bảo mật và trách nhiệm bồi thường.',
      en: 'Specialist reviews legal risks, unfavorable terms, payment obligations, confidentiality, and indemnification.',
      zh: '专家审核法律风险、不利条款、付款义务、保密和赔偿。',
      ja: '専門家が法的リスク、不利な条件、支払義務、機密保持、補償責任をレビュー。',
    },
    tags: [
      { label: { vi: 'Cần tài liệu', en: 'Docs needed', zh: '需要文件', ja: '書類必要' }, variant: 'orange' },
    ],
  },
  {
    id: 'other',
    title: {
      vi: 'Dịch vụ khác / chưa rõ loại việc',
      en: 'Other / Unclear type',
      zh: '其他/类型不明',
      ja: 'その他/不明',
    },
    description: {
      vi: 'Hồ sơ sẽ được chuyển để chuyên viên phân loại trước khi xử lý chính thức.',
      en: 'Request will be forwarded to specialist for classification before official processing.',
      zh: '文件将被转发给专家分类后再正式处理。',
      ja: 'リクエストは正式処理前に専門家が分類します。',
    },
    tags: [
      { label: { vi: 'Phân loại', en: 'Classify', zh: '分类', ja: '分類' }, variant: 'red' },
    ],
  },
];

interface ServiceTypeSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  locale?: string;
}

export default function ServiceTypeSelector({ selectedId, onSelect, locale = 'vi' }: ServiceTypeSelectorProps) {
  const t = useTranslations('UserCreateRequest');

  return (
    <div className="space-y-4">
      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '18px' }}>
        {t('serviceTypeSelectHint')}
      </p>
      {SERVICE_OPTIONS.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          selected={service.id === selectedId}
          onSelect={() => onSelect(service.id)}
          locale={locale}
        />
      ))}
    </div>
  );
}
