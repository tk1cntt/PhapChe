/**
 * Guided Discovery — Scenarios to Legal Domain Mapping
 *
 * Everyday-language scenarios giúp người dùng thông thường
 * chọn được lĩnh vực pháp lý phù hợp mà không cần hiểu thuật ngữ luật.
 *
 * Mỗi scenario map đến 1-3 domains được suggest mạnh nhất.
 */

export interface GuidedScenario {
  key: string;
  icon: string; // emoji
  label: {
    vi: string;
    en: string;
    zh: string;
    ja: string;
  };
  /** Domain keys được suggest sau khi người dùng chọn scenario này */
  suggestedDomainKeys: string[];
}

/**
 * 10 guided scenarios cho Step 0
 */
export const GUIDED_SCENARIOS: GuidedScenario[] = [
  {
    key: 'start_business',
    icon: '🏢',
    label: {
      vi: 'Tôi muốn mở công ty / khởi nghiệp',
      en: 'I want to start a business / company',
      zh: '我想创办公司/创业',
      ja: '会社を設立したい / 起業したい',
    },
    suggestedDomainKeys: ['corporate-legal', 'commercial-legal', 'regulatory-legal'],
  },
  {
    key: 'contracts',
    icon: '📄',
    label: {
      vi: 'Tôi cần soạn / kiểm tra hợp đồng',
      en: 'I need to draft / review a contract',
      zh: '我需要起草/审查合同',
      ja: '契約書を作成・確認したい',
    },
    suggestedDomainKeys: ['commercial-legal', 'employment-legal'],
  },
  {
    key: 'dispute',
    icon: '⚖️',
    label: {
      vi: 'Có tranh chấp với đối tác / người khác',
      en: 'I have a dispute with a partner / someone',
      zh: '我与合作伙伴/他人发生争议',
      ja: '取引先・他者との紛争がある',
    },
    suggestedDomainKeys: ['litigation-legal', 'commercial-legal'],
  },
  {
    key: 'employees',
    icon: '👔',
    label: {
      vi: 'Vấn đề về lao động / nhân viên',
      en: 'Employment / employee matters',
      zh: '劳动/员工问题',
      ja: '労働・従業員の問題',
    },
    suggestedDomainKeys: ['employment-legal'],
  },
  {
    key: 'ip_brand',
    icon: '💡',
    label: {
      vi: 'Tôi cần bảo vệ ý tưởng / thương hiệu / sáng chế',
      en: 'I need to protect my idea / brand / invention',
      zh: '我需要保护我的创意/品牌/发明',
      ja: 'アイデア・ブランド・発明を保護したい',
    },
    suggestedDomainKeys: ['ip-legal'],
  },
  {
    key: 'data_privacy',
    icon: '🔒',
    label: {
      vi: 'Vấn đề về dữ liệu / bảo mật thông tin',
      en: 'Data / privacy / information security matters',
      zh: '数据/隐私/信息安全问题',
      ja: 'データ・プライバシー・情報セキュリティの問題',
    },
    suggestedDomainKeys: ['privacy-legal', 'ai-governance-legal'],
  },
  {
    key: 'product_terms',
    icon: '📱',
    label: {
      vi: 'Tôi có sản phẩm / dịch vụ cần điều khoản sử dụng',
      en: 'I have a product / service needing terms',
      zh: '我的产品/服务需要使用条款',
      ja: '製品・サービスの利用規約が必要',
    },
    suggestedDomainKeys: ['product-legal'],
  },
  {
    key: 'compliance',
    icon: '✅',
    label: {
      vi: 'Tôi cần giấy phép / kiểm tra tuân thủ quy định',
      en: 'I need licenses / compliance checks',
      zh: '我需要许可证/合规检查',
      ja: '許可証・コンプライアンス確認が必要',
    },
    suggestedDomainKeys: ['regulatory-legal', 'corporate-legal'],
  },
  {
    key: 'ai_tech',
    icon: '🤖',
    label: {
      vi: 'Vấn đề liên quan đến AI / công nghệ',
      en: 'AI / technology related matters',
      zh: 'AI/技术相关问题',
      ja: 'AI・テクノロジー関連の問題',
    },
    suggestedDomainKeys: ['ai-governance-legal', 'privacy-legal', 'product-legal'],
  },
  {
    key: 'other',
    icon: '🤷',
    label: {
      vi: 'Khác / Tôi không chắc mình cần gì',
      en: 'Other / I\'m not sure what I need',
      zh: '其他/我不确定我需要什么',
      ja: 'その他 / 何が必要かわからない',
    },
    suggestedDomainKeys: [], // empty = show all 13 domains
  },
];

/**
 * Lấy danh sách domain keys được suggest từ scenario
 * Trả về mảng rỗng nếu cần hiển thị tất cả (scenario "other")
 */
export function getSuggestedDomainKeys(scenarioKey: string): string[] {
  const scenario = GUIDED_SCENARIOS.find((s) => s.key === scenarioKey);
  return scenario?.suggestedDomainKeys ?? [];
}
