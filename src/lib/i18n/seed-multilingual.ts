/**
 * Multilingual seed data for database initialization
 * Contains translations for VI, EN, ZH, JA
 */

import type { MultilingualString, MultilingualText } from './types';

/**
 * Seed data version
 * Update this when seed data changes
 * Used for rollback and migration tracking
 */
export const SEED_VERSION = '1.0.0';

/**
 * Seed data metadata
 */
export const SEED_METADATA = {
  version: SEED_VERSION,
  createdAt: '2026-06-12',
  locales: ['vi', 'en', 'zh', 'ja'] as const,
  primaryLocale: 'vi',
};

/**
 * Matter type seed data with all translations
 * VI is primary (required), others are optional
 */
export const SEED_MATTER_TYPES = {
  labor_contract: {
    label: {
      vi: 'Soạn hợp đồng lao động',
      en: 'Labor Contract',
      zh: '劳动合同',
      ja: '労働契約',
    } as MultilingualString,
    description: {
      vi: 'Ghi nhận vị trí, lương, thời hạn và điều kiện làm việc chính.',
      en: 'Document position, salary, contract term, and main working conditions.',
      zh: '记录职位、薪资、合同期限和主要工作条件。',
      ja: '役職、薪酬、契約期間、主要な勤務条件を記載します。',
    } as MultilingualText,
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'employee_role', label: 'Vị trí công việc', required: true, type: 'text' },
      { key: 'salary', label: 'Mức lương hoặc thỏa thuận lương', required: true, type: 'text' },
      { key: 'contract_term', label: 'Thời hạn hợp đồng', required: true, type: 'text' },
      { key: 'workplace', label: 'Địa điểm làm việc', required: false, type: 'text' },
    ],
  },
  agency_contract: {
    label: {
      vi: 'Soạn hợp đồng đại lý',
      en: 'Agency Contract',
      zh: '代理合同',
      ja: '代理店契約',
    } as MultilingualString,
    description: {
      vi: 'Chuẩn hóa thông tin đối tác, chiết khấu và thời hạn hợp đồng đại lý.',
      en: 'Standardize partner information, commission rates, and agency contract terms.',
      zh: '标准化合作伙伴信息、佣金率和代理合同条款。',
      ja: 'パートナー情報、コミッション率、代理店契約条件を標準化します。',
    } as MultilingualText,
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'partner_name', label: 'Tên đối tác đại lý', required: true, type: 'text' },
      { key: 'commission_rate', label: 'Tỷ lệ hoa hồng hoặc chiết khấu', required: true, type: 'text' },
      { key: 'contract_term', label: 'Thời hạn hợp đồng', required: true, type: 'text' },
      { key: 'special_terms', label: 'Yêu cầu đặc biệt khác', required: false, type: 'textarea' },
    ],
  },
  trademark_registration: {
    label: {
      vi: 'Đăng ký nhãn hiệu',
      en: 'Trademark Registration',
      zh: '商标注册',
      ja: '商标登録',
    } as MultilingualString,
    description: {
      vi: 'Thu thập tên nhãn hiệu, nhóm sản phẩm/dịch vụ và chủ sở hữu.',
      en: 'Collect trademark name, product/service groups, and ownership.',
      zh: '收集商标名称、产品/服务组和所有权信息。',
      ja: '商标名、製品/サービスグループ、所有権情報を収集します。',
    } as MultilingualText,
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'trademark_name', label: 'Tên nhãn hiệu', required: true, type: 'text' },
      { key: 'owner_name', label: 'Tên chủ sở hữu dự kiến', required: true, type: 'text' },
      { key: 'goods_services', label: 'Nhóm sản phẩm hoặc dịch vụ', required: true, type: 'textarea' },
      { key: 'prior_use', label: 'Thông tin đã sử dụng nhãn hiệu', required: false, type: 'textarea' },
    ],
  },
  unsupported: {
    label: {
      vi: 'Dịch vụ khác / chưa rõ loại việc',
      en: 'Other / Unclear',
      zh: '其他 / 不明确',
      ja: 'その他 / 不明',
    } as MultilingualString,
    description: {
      vi: 'Hồ sơ sẽ được chuyển để chuyên viên phân loại trước khi xử lý.',
      en: 'Request will be routed to specialist for classification before processing.',
      zh: '请求将在处理前被转交给专家进行分类。',
      ja: 'リクエストは処理前にスペシャリストが分類します。',
    } as MultilingualText,
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'request_summary', label: 'Tóm tắt nhu cầu hỗ trợ', required: true, type: 'textarea' },
      { key: 'desired_outcome', label: 'Kết quả mong muốn', required: false, type: 'textarea' },
    ],
  },
} as const;

/**
 * Folder seed data with all translations
 */
export const SEED_FOLDERS = {
  contracts: {
    name: {
      vi: 'Hợp đồng',
      en: 'Contracts',
      zh: '合同',
      ja: '契約',
    } as MultilingualString,
  },
  agreements: {
    name: {
      vi: 'Thỏa thuận',
      en: 'Agreements',
      zh: '协议',
      ja: '合意',
    } as MultilingualString,
  },
  trademark: {
    name: {
      vi: 'Nhãn hiệu',
      en: 'Trademark',
      zh: '商标',
      ja: '商标',
    } as MultilingualString,
  },
  incorporation: {
    name: {
      vi: 'Thành lập công ty',
      en: 'Incorporation',
      zh: '公司成立',
      ja: '会社設立',
    } as MultilingualString,
  },
} as const;

/**
 * Tag seed data with all translations
 */
export const SEED_TAGS = {
  urgent: {
    label: {
      vi: 'Khẩn cấp',
      en: 'Urgent',
      zh: '紧急',
      ja: '緊急',
    } as MultilingualString,
  },
  confidential: {
    label: {
      vi: 'Bí mật',
      en: 'Confidential',
      zh: '机密',
      ja: '機密',
    } as MultilingualString,
  },
  contract_signed: {
    label: {
      vi: 'Đã ký',
      en: 'Signed',
      zh: '已签署',
      ja: '署名済み',
    } as MultilingualString,
  },
  draft: {
    label: {
      vi: 'Bản nháp',
      en: 'Draft',
      zh: '草稿',
      ja: '下書き',
    } as MultilingualString,
  },
} as const;

/**
 * Get seed data statistics
 */
export function getSeedStats() {
  return {
    version: SEED_VERSION,
    matterTypes: Object.keys(SEED_MATTER_TYPES).length,
    folders: Object.keys(SEED_FOLDERS).length,
    tags: Object.keys(SEED_TAGS).length,
    locales: SEED_METADATA.locales,
  };
}
