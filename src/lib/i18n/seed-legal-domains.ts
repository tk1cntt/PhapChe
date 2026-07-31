/**
 * Legal Domain Taxonomy Seed Data
 * 13 legal domains with 30+ service types and multilingual support (VI/EN/ZH/JA)
 *
 * This file defines the 2-layer service selection structure:
 * - Layer 1: Legal Domain (e.g., "Thương mại", "Doanh nghiệp")
 * - Layer 2: Service Type (e.g., "Hợp đồng phân phối", "NDA")
 */

import type { MultilingualString, MultilingualText } from './types';

/**
 * Question definition for service types
 */
export interface QuestionDefinition {
  key: string;
  label: MultilingualString;
  required: boolean;
  type: 'text' | 'textarea';
}

/**
 * Service type definition
 */
export interface ServiceTypeDefinition {
  key: string;
  label: MultilingualString;
  description: MultilingualText;
  questions: QuestionDefinition[];
}

/**
 * Legal domain definition
 */
export interface LegalDomainDefinition {
  key: string;
  label: MultilingualString;
  icon: string; // Lucide icon name
  description: MultilingualText;
  matterTypeKeys: string[];
}

/**
 * Service types with multilingual labels and questions
 * Expanded from 4 to 32 types
 */
export const SEED_MATTER_TYPES: Record<string, ServiceTypeDefinition> = {
  // === Existing types (preserved) ===
  labor_contract: {
    key: 'labor_contract',
    label: {
      vi: 'Soạn hợp đồng lao động',
      en: 'Labor Contract',
      zh: '劳动合同',
      ja: '労働契約',
    },
    description: {
      vi: 'Ghi nhận vị trí, lương, thời hạn và điều kiện làm việc chính.',
      en: 'Document position, salary, contract term, and main working conditions.',
      zh: '记录职位、薪资、合同期限和主要工作条件。',
      ja: '役職、薪酬、契約期間、主要な勤務条件を記載します。',
    },
    questions: [
      { key: 'employee_role', label: { vi: 'Vị trí công việc', en: 'Job Position', zh: '职位', ja: '職位' }, required: true, type: 'text' },
      { key: 'salary', label: { vi: 'Mức lương hoặc thỏa thuận lương', en: 'Salary or compensation agreement', zh: '薪资或薪酬协议', ja: '給与または報酬合意' }, required: true, type: 'text' },
      { key: 'contract_term', label: { vi: 'Thời hạn hợp đồng', en: 'Contract Duration', zh: '合同期限', ja: '契約期間' }, required: true, type: 'text' },
      { key: 'workplace', label: { vi: 'Địa điểm làm việc', en: 'Workplace Location', zh: '工作地点', ja: '勤務地' }, required: false, type: 'text' },
    ],
  },
  agency_contract: {
    key: 'agency_contract',
    label: {
      vi: 'Soạn hợp đồng đại lý',
      en: 'Agency Contract',
      zh: '代理合同',
      ja: '代理店契約',
    },
    description: {
      vi: 'Chuẩn hóa thông tin đối tác, chiết khấu và thời hạn hợp đồng đại lý.',
      en: 'Standardize partner information, commission rates, and agency contract terms.',
      zh: '标准化合作伙伴信息、佣金率和代理合同条款。',
      ja: 'パートナー情報、コミッション率、代理店契約条件を標準化します。',
    },
    questions: [
      { key: 'partner_name', label: { vi: 'Tên đối tác đại lý', en: 'Agent/Partner Name', zh: '代理/合作伙伴名称', ja: '代理パートナー名' }, required: true, type: 'text' },
      { key: 'commission_rate', label: { vi: 'Tỷ lệ hoa hồng hoặc chiết khấu', en: 'Commission Rate or Discount', zh: '佣金率或折扣', ja: '手数料率または割引' }, required: true, type: 'text' },
      { key: 'contract_term', label: { vi: 'Thời hạn hợp đồng', en: 'Contract Duration', zh: '合同期限', ja: '契約期間' }, required: true, type: 'text' },
      { key: 'special_terms', label: { vi: 'Yêu cầu đặc biệt khác', en: 'Other Special Requirements', zh: '其他特殊要求', ja: 'その他特別要件' }, required: false, type: 'textarea' },
    ],
  },
  trademark_registration: {
    key: 'trademark_registration',
    label: {
      vi: 'Đăng ký nhãn hiệu',
      en: 'Trademark Registration',
      zh: '商标注册',
      ja: '商标登録',
    },
    description: {
      vi: 'Thu thập tên nhãn hiệu, nhóm sản phẩm/dịch vụ và chủ sở hữu.',
      en: 'Collect trademark name, product/service groups, and ownership.',
      zh: '收集商标名称、产品/服务组和所有权信息。',
      ja: '商标名、製品/サービスグループ、所有権情報を収集します。',
    },
    questions: [
      { key: 'trademark_name', label: { vi: 'Tên nhãn hiệu', en: 'Trademark Name', zh: '商标名称', ja: '商標名' }, required: true, type: 'text' },
      { key: 'owner_name', label: { vi: 'Tên chủ sở hữu dự kiến', en: 'Prospective Owner Name', zh: '预期所有人名称', ja: '予定所有者名' }, required: true, type: 'text' },
      { key: 'goods_services', label: { vi: 'Nhóm sản phẩm hoặc dịch vụ', en: 'Product or Service Group', zh: '产品或服务组别', ja: '製品またはサービスクラス' }, required: true, type: 'textarea' },
      { key: 'prior_use', label: { vi: 'Thông tin đã sử dụng nhãn hiệu', en: 'Prior Trademark Use Info', zh: '在先商标使用信息', ja: '商標の先行使用情報' }, required: false, type: 'textarea' },
    ],
  },
  // Fallback type for requests that don't match any known domain
  unsupported: {
    key: 'unsupported',
    label: {
      vi: 'Dịch vụ khác / chưa rõ loại việc',
      en: 'Other / Unclear',
      zh: '其他 / 不明确',
      ja: 'その他 / 不明',
    },
    description: {
      vi: 'Hồ sơ sẽ được chuyển để chuyên viên phân loại trước khi xử lý.',
      en: 'Request will be routed to specialist for classification before processing.',
      zh: '请求将在处理前被转交给专家进行分类。',
      ja: 'リクエストは処理前にスペシャリストが分類します。',
    },
    questions: [
      { key: 'request_summary', label: { vi: 'Tóm tắt nhu cầu hỗ trợ', en: 'Support Request Summary', zh: '支持需求摘要', ja: 'サポート依頼概要' }, required: true, type: 'textarea' },
      { key: 'desired_outcome', label: { vi: 'Kết quả mong muốn', en: 'Desired Outcome', zh: '期望结果', ja: '望ましい結果' }, required: false, type: 'textarea' },
    ],
  },

  // === New types for Phase 76 ===

  // Commercial Legal
  distribution_contract: {
    key: 'distribution_contract',
    label: {
      vi: 'Hợp đồng phân phối',
      en: 'Distribution Contract',
      zh: '分销合同',
      ja: '流通契約',
    },
    description: {
      vi: 'Soạn thảo hợp đồng phân phối sản phẩm/dịch vụ.',
      en: 'Draft product/service distribution agreement.',
      zh: '起草产品/服务分销协议。',
      ja: '製品/サービスの流通契約書を作成します。',
    },
    questions: [
      { key: 'distributor_name', label: { vi: 'Tên nhà phân phối', en: 'Distributor Name', zh: '经销商名称', ja: '販売代理店名' }, required: true, type: 'text' },
      { key: 'product_service', label: { vi: 'Sản phẩm/dịch vụ phân phối', en: 'Distributed Product/Service', zh: '分销产品/服务', ja: '販売製品・サービス' }, required: true, type: 'text' },
      { key: 'territory', label: { vi: 'Khu vực phân phối', en: 'Distribution Territory', zh: '分销区域', ja: '販売地域' }, required: true, type: 'text' },
      { key: 'contract_term', label: { vi: 'Thời hạn hợp đồng', en: 'Contract Duration', zh: '合同期限', ja: '契約期間' }, required: false, type: 'text' },
    ],
  },
  nda: {
    key: 'nda',
    label: {
      vi: 'Thỏa thuận bảo mật (NDA)',
      en: 'Non-Disclosure Agreement',
      zh: '保密协议',
      ja: '秘密保持契約',
    },
    description: {
      vi: 'Soạn thỏa thuận bảo mật thông tin giữa các bên.',
      en: 'Draft confidentiality agreement between parties.',
      zh: '起草各方之间的保密协议。',
      ja: '当事者間の秘密保持契約書を作成します。',
    },
    questions: [
      { key: 'parties', label: { vi: 'Các bên tham gia', en: 'Parties/Entity Names', zh: '参与方', ja: '当事者' }, required: true, type: 'text' },
      { key: 'confidential_info', label: { vi: 'Loại thông tin cần bảo mật', en: 'Confidential Information Type', zh: '需保密信息类型', ja: '秘密情報の種類' }, required: true, type: 'textarea' },
      { key: 'duration', label: { vi: 'Thời hạn bảo mật', en: 'Confidentiality Duration', zh: '保密期限', ja: '秘密保持期間' }, required: true, type: 'text' },
    ],
  },
  commercial_review: {
    key: 'commercial_review',
    label: {
      vi: 'Rà soát hợp đồng thương mại',
      en: 'Commercial Contract Review',
      zh: '商业合同审查',
      ja: '商事契約レビュー',
    },
    description: {
      vi: 'Rà soát và tư vấn hợp đồng thương mại hiện có.',
      en: 'Review and advise on existing commercial contracts.',
      zh: '审查并就现有商业合同提供建议。',
      ja: '既存の商事契約をレビューし、アドバイスを提供します。',
    },
    questions: [
      { key: 'contract_type', label: { vi: 'Loại hợp đồng', en: 'Contract Type', zh: '合同类型', ja: '契約タイプ' }, required: true, type: 'text' },
      { key: 'parties', label: { vi: 'Các bên tham gia', en: 'Parties/Entity Names', zh: '参与方', ja: '当事者' }, required: true, type: 'text' },
      { key: 'concerns', label: { vi: 'Vấn đề cần quan tâm', en: 'Concerns', zh: '关注问题', ja: '懸念事項' }, required: false, type: 'textarea' },
    ],
  },

  // Corporate Legal
  incorporation: {
    key: 'incorporation',
    label: {
      vi: 'Thành lập công ty',
      en: 'Company Incorporation',
      zh: '公司成立',
      ja: '会社設立',
    },
    description: {
      vi: 'Tư vấn và soạn hồ sơ thành lập doanh nghiệp.',
      en: 'Advise and draft company incorporation documents.',
      zh: '咨询并起草公司成立文件。',
      ja: '会社設立のアドバイスと書類作成を行います。',
    },
    questions: [
      { key: 'company_name', label: { vi: 'Tên công ty dự kiến', en: 'Proposed Company Name', zh: '拟定公司名称', ja: '予定会社名' }, required: true, type: 'text' },
      { key: 'business_type', label: { vi: 'Loại hình doanh nghiệp', en: 'Business Entity Type', zh: '企业类型', ja: '法人形態' }, required: true, type: 'text' },
      { key: 'capital', label: { vi: 'Vốn điều lệ', en: 'Charter Capital', zh: '注册资本', ja: '資本金' }, required: true, type: 'text' },
      { key: 'founders', label: { vi: 'Thông tin sáng lập viên', en: 'Founder Information', zh: '创始人信息', ja: '発起人情報' }, required: true, type: 'textarea' },
    ],
  },
  shareholder_agreement: {
    key: 'shareholder_agreement',
    label: {
      vi: 'Thỏa thuận cổ đông',
      en: 'Shareholder Agreement',
      zh: '股东协议',
      ja: '株主間契約',
    },
    description: {
      vi: 'Soạn thỏa thuận giữa các cổ đông về quyền và nghĩa vụ.',
      en: 'Draft agreement between shareholders on rights and obligations.',
      zh: '起草股东之间关于权利和义务的协议。',
      ja: '株主間の権利と義務に関する契約書を作成します。',
    },
    questions: [
      { key: 'shareholders', label: { vi: 'Danh sách cổ đông', en: 'Shareholder List', zh: '股东名单', ja: '株主一覧' }, required: true, type: 'textarea' },
      { key: 'ownership_structure', label: { vi: 'Cơ cấu sở hữu', en: 'Ownership Structure', zh: '所有权结构', ja: '所有構造' }, required: true, type: 'text' },
      { key: 'voting_rights', label: { vi: 'Quyền biểu quyết', en: 'Voting Rights', zh: '表决权', ja: '議決権' }, required: false, type: 'textarea' },
    ],
  },
  m_and_a: {
    key: 'm_and_a',
    label: {
      vi: 'Mua bán và sáp nhập (M&A)',
      en: 'Mergers & Acquisitions',
      zh: '并购',
      ja: 'M&A',
    },
    description: {
      vi: 'Tư vấn pháp lý cho giao dịch mua bán, sáp nhập doanh nghiệp.',
      en: 'Legal advice for business merger and acquisition transactions.',
      zh: '为企业并购交易提供法律咨询。',
      ja: '企業の合併・買収取引に関する法的アドバイスを提供します。',
    },
    questions: [
      { key: 'transaction_type', label: { vi: 'Loại giao dịch', en: 'Transaction Type', zh: '交易类型', ja: '取引タイプ' }, required: true, type: 'text' },
      { key: 'target_company', label: { vi: 'Công ty mục tiêu', en: 'Target Company', zh: '目标公司', ja: '対象会社' }, required: true, type: 'text' },
      { key: 'transaction_value', label: { vi: 'Giá trị giao dịch', en: 'Transaction Value', zh: '交易金额', ja: '取引金額' }, required: false, type: 'text' },
    ],
  },

  // Employment Legal
  internal_regulations: {
    key: 'internal_regulations',
    label: {
      vi: 'Nội quy lao động',
      en: 'Internal Labor Regulations',
      zh: '内部劳动规章',
      ja: '社内就業規則',
    },
    description: {
      vi: 'Soạn thảo nội quy lao động cho doanh nghiệp.',
      en: 'Draft internal labor regulations for business.',
      zh: '为企业起草内部劳动规章。',
      ja: '企業向けの社内就業規則を作成します。',
    },
    questions: [
      { key: 'company_size', label: { vi: 'Quy mô công ty (số nhân viên)', en: 'Company Size (employees)', zh: '公司规模（员工数）', ja: '会社規模（従業員数）' }, required: true, type: 'text' },
      { key: 'work_schedule', label: { vi: 'Chế độ làm việc', en: 'Work Mode', zh: '工作模式', ja: '勤務形態' }, required: true, type: 'text' },
      { key: 'discipline_rules', label: { vi: 'Quy định kỷ luật', en: 'Disciplinary Rules', zh: '纪律规定', ja: '懲戒規定' }, required: false, type: 'textarea' },
    ],
  },
  labor_dispute: {
    key: 'labor_dispute',
    label: {
      vi: 'Tranh chấp lao động',
      en: 'Labor Dispute',
      zh: '劳动争议',
      ja: '労働紛争',
    },
    description: {
      vi: 'Tư vấn giải quyết tranh chấp lao động.',
      en: 'Advise on labor dispute resolution.',
      zh: '就劳动争议解决提供咨询。',
      ja: '労働紛争の解決についてアドバイスを提供します。',
    },
    questions: [
      { key: 'dispute_type', label: { vi: 'Loại tranh chấp', en: 'Dispute Type', zh: '争议类型', ja: '紛争種類' }, required: true, type: 'text' },
      { key: 'parties', label: { vi: 'Các bên liên quan', en: 'Relevant Parties', zh: '相关方', ja: '関係者' }, required: true, type: 'text' },
      { key: 'desired_outcome', label: { vi: 'Kết quả mong muốn', en: 'Desired Outcome', zh: '期望结果', ja: '望ましい結果' }, required: true, type: 'textarea' },
    ],
  },

  // Privacy Legal
  privacy_policy: {
    key: 'privacy_policy',
    label: {
      vi: 'Chính sách bảo mật',
      en: 'Privacy Policy',
      zh: '隐私政策',
      ja: 'プライバシーポリシー',
    },
    description: {
      vi: 'Soạn chính sách bảo mật dữ liệu cá nhân.',
      en: 'Draft personal data privacy policy.',
      zh: '起草个人数据隐私政策。',
      ja: '個人データのプライバシーポリシーを作成します。',
    },
    questions: [
      { key: 'data_types', label: { vi: 'Loại dữ liệu thu thập', en: 'Data Categories Collected', zh: '收集的数据类别', ja: '収集データカテゴリ' }, required: true, type: 'textarea' },
      { key: 'data_subjects', label: { vi: 'Đối tượng dữ liệu', en: 'Data Subjects', zh: '数据主体', ja: 'データ主体' }, required: true, type: 'text' },
      { key: 'third_parties', label: { vi: 'Bên thứ ba chia sẻ dữ liệu', en: 'Third-party Data Recipients', zh: '第三方数据接收方', ja: '第三者データ受領者' }, required: false, type: 'textarea' },
    ],
  },
  dpia: {
    key: 'dpia',
    label: {
      vi: 'Đánh giá tác động bảo mật (DPIA)',
      en: 'Data Protection Impact Assessment',
      zh: '数据保护影响评估',
      ja: 'データ保護影響評価',
    },
    description: {
      vi: 'Đánh giá tác động của xử lý dữ liệu đến quyền riêng tư.',
      en: 'Assess impact of data processing on privacy rights.',
      zh: '评估数据处理对隐私权的影响。',
      ja: 'データ処理がプライバシー権に与える影響を評価します。',
    },
    questions: [
      { key: 'processing_activity', label: { vi: 'Hoạt động xử lý dữ liệu', en: 'Data Processing Activities', zh: '数据处理活动', ja: 'データ処理活動' }, required: true, type: 'textarea' },
      { key: 'data_categories', label: { vi: 'Danh mục dữ liệu', en: 'Data Inventory', zh: '数据清单', ja: 'データ一覧' }, required: true, type: 'text' },
      { key: 'risk_level', label: { vi: 'Mức độ rủi ro dự kiến', en: 'Expected Risk Level', zh: '预期风险等级', ja: '想定リスクレベル' }, required: false, type: 'text' },
    ],
  },
  data_processing_agreement: {
    key: 'data_processing_agreement',
    label: {
      vi: 'Thỏa thuận xử lý dữ liệu',
      en: 'Data Processing Agreement',
      zh: '数据处理协议',
      ja: 'データ処理契約',
    },
    description: {
      vi: 'Soạn thỏa thuận xử lý dữ liệu giữa các bên.',
      en: 'Draft data processing agreement between parties.',
      zh: '起草各方之间的数据处理协议。',
      ja: '当事者間のデータ処理契約書を作成します。',
    },
    questions: [
      { key: 'data_controller', label: { vi: 'Bên kiểm soát dữ liệu', en: 'Data Controller', zh: '数据控制者', ja: 'データ管理者' }, required: true, type: 'text' },
      { key: 'data_processor', label: { vi: 'Bên xử lý dữ liệu', en: 'Data Processor', zh: '数据处理者', ja: 'データ処理者' }, required: true, type: 'text' },
      { key: 'processing_purpose', label: { vi: 'Mục đích xử lý', en: 'Processing Purpose', zh: '处理目的', ja: '処理目的' }, required: true, type: 'textarea' },
    ],
  },

  // Product Legal
  terms_of_service: {
    key: 'terms_of_service',
    label: {
      vi: 'Điều khoản dịch vụ',
      en: 'Terms of Service',
      zh: '服务条款',
      ja: '利用規約',
    },
    description: {
      vi: 'Soạn điều khoản sử dụng dịch vụ/sản phẩm.',
      en: 'Draft terms of service/product usage.',
      zh: '起草服务/产品使用条款。',
      ja: 'サービス/製品の利用規約を作成します。',
    },
    questions: [
      { key: 'service_name', label: { vi: 'Tên dịch vụ/sản phẩm', en: 'Service/Product Name', zh: '服务/产品名称', ja: 'サービス・製品名' }, required: true, type: 'text' },
      { key: 'user_type', label: { vi: 'Loại người dùng', en: 'User Type', zh: '用户类型', ja: 'ユーザータイプ' }, required: true, type: 'text' },
      { key: 'payment_terms', label: { vi: 'Điều khoản thanh toán', en: 'Payment Terms', zh: '付款条款', ja: '支払条件' }, required: false, type: 'textarea' },
    ],
  },
  return_policy: {
    key: 'return_policy',
    label: {
      vi: 'Chính sách đổi trả',
      en: 'Return Policy',
      zh: '退货政策',
      ja: '返品ポリシー',
    },
    description: {
      vi: 'Soạn chính sách đổi trả hàng hóa/dịch vụ.',
      en: 'Draft goods/service return policy.',
      zh: '起草商品/服务退货政策。',
      ja: '商品/サービスの返品ポリシーを作成します。',
    },
    questions: [
      { key: 'product_type', label: { vi: 'Loại sản phẩm/dịch vụ', en: 'Product/Service Type', zh: '产品/服务类型', ja: '製品・サービス種類' }, required: true, type: 'text' },
      { key: 'return_period', label: { vi: 'Thời hạn đổi trả', en: 'Return/Exchange Period', zh: '退换期限', ja: '返品交換期間' }, required: true, type: 'text' },
      { key: 'conditions', label: { vi: 'Điều kiện đổi trả', en: 'Return/Exchange Conditions', zh: '退换条件', ja: '返品・交換条件' }, required: false, type: 'textarea' },
    ],
  },
  product_liability: {
    key: 'product_liability',
    label: {
      vi: 'Trách nhiệm sản phẩm',
      en: 'Product Liability',
      zh: '产品责任',
      ja: '製造物責任',
    },
    description: {
      vi: 'Tư vấn về trách nhiệm pháp lý đối với sản phẩm.',
      en: 'Advise on product legal liability.',
      zh: '就产品法律责任提供咨询。',
      ja: '製品の法的責任についてアドバイスを提供します。',
    },
    questions: [
      { key: 'product_name', label: { vi: 'Tên sản phẩm', en: 'Product Name', zh: '产品名称', ja: '製品名' }, required: true, type: 'text' },
      { key: 'incident_description', label: { vi: 'Mô tả sự cố', en: 'Incident Description', zh: '事件描述', ja: 'インシデント説明' }, required: true, type: 'textarea' },
      { key: 'damages', label: { vi: 'Thiệt hại ước tính', en: 'Estimated Damages', zh: '预估损失', ja: '推定損害額' }, required: false, type: 'text' },
    ],
  },

  // Regulatory Legal
  business_license: {
    key: 'business_license',
    label: {
      vi: 'Giấy phép kinh doanh',
      en: 'Business License',
      zh: '营业执照',
      ja: '営業許可',
    },
    description: {
      vi: 'Tư vấn và hỗ trợ xin giấy phép kinh doanh.',
      en: 'Advise and assist with business license application.',
      zh: '咨询并协助申请营业执照。',
      ja: '営業許可申請のアドバイスと支援を行います。',
    },
    questions: [
      { key: 'business_type', label: { vi: 'Loại hình kinh doanh', en: 'Business Type', zh: '业务类型', ja: '事業種類' }, required: true, type: 'text' },
      { key: 'license_type', label: { vi: 'Loại giấy phép cần', en: 'License Type Required', zh: '所需许可类型', ja: '必要許可種類' }, required: true, type: 'text' },
      { key: 'business_location', label: { vi: 'Địa điểm kinh doanh', en: 'Business Location', zh: '经营地点', ja: '事業所所在地' }, required: false, type: 'text' },
    ],
  },
  compliance_report: {
    key: 'compliance_report',
    label: {
      vi: 'Báo cáo tuân thủ',
      en: 'Compliance Report',
      zh: '合规报告',
      ja: 'コンプライアンスレポート',
    },
    description: {
      vi: 'Soạn báo cáo đánh giá tuân thủ pháp luật.',
      en: 'Draft legal compliance assessment report.',
      zh: '起草法律合规评估报告。',
      ja: '法令コンプライアンス評価報告書を作成します。',
    },
    questions: [
      { key: 'compliance_area', label: { vi: 'Lĩnh vực cần đánh giá', en: 'Compliance Area to Assess', zh: '需评估的合规领域', ja: '評価対象コンプライアンス分野' }, required: true, type: 'text' },
      { key: 'current_status', label: { vi: 'Tình trạng hiện tại', en: 'Current Status', zh: '当前状况', ja: '現状' }, required: true, type: 'textarea' },
      { key: 'period', label: { vi: 'Kỳ đánh giá', en: 'Assessment Period', zh: '评估期间', ja: '評価期間' }, required: false, type: 'text' },
    ],
  },

  // AI Governance Legal
  ai_policy: {
    key: 'ai_policy',
    label: {
      vi: 'Chính sách AI',
      en: 'AI Policy',
      zh: 'AI政策',
      ja: 'AIポリシー',
    },
    description: {
      vi: 'Soạn chính sách quản trị và sử dụng AI trong doanh nghiệp.',
      en: 'Draft AI governance and usage policy for business.',
      zh: '为企业起草AI治理和使用政策。',
      ja: '企業向けのAIガバナンスと利用ポリシーを作成します。',
    },
    questions: [
      { key: 'ai_use_cases', label: { vi: 'Mục đích sử dụng AI', en: 'AI Use Cases', zh: 'AI用例', ja: 'AI利用目的' }, required: true, type: 'textarea' },
      { key: 'data_usage', label: { vi: 'Dữ liệu AI sử dụng', en: 'Data Used by AI', zh: 'AI使用的数据', ja: 'AI使用データ' }, required: true, type: 'text' },
      { key: 'risk_concerns', label: { vi: 'Lo ngại về rủi ro', en: 'Risk Concerns', zh: '风险顾虑', ja: 'リスク懸念' }, required: false, type: 'textarea' },
    ],
  },
  algorithm_audit: {
    key: 'algorithm_audit',
    label: {
      vi: 'Kiểm toán thuật toán',
      en: 'Algorithm Audit',
      zh: '算法审计',
      ja: 'アルゴリズム監査',
    },
    description: {
      vi: 'Đánh giá tính công bằng và minh bạch của thuật toán AI.',
      en: 'Assess fairness and transparency of AI algorithms.',
      zh: '评估AI算法的公平性和透明度。',
      ja: 'AIアルゴリズムの公平性と透明性を評価します。',
    },
    questions: [
      { key: 'algorithm_type', label: { vi: 'Loại thuật toán', en: 'Algorithm Type', zh: '算法类型', ja: 'アルゴリズム種類' }, required: true, type: 'text' },
      { key: 'decision_made', label: { vi: 'Quyết định thuật toán đưa ra', en: 'Algorithmic Decisions Made', zh: '算法做出的决定', ja: 'アルゴリズムによる判断' }, required: true, type: 'textarea' },
      { key: 'affected_groups', label: { vi: 'Nhóm đối tượng bị ảnh hưởng', en: 'Affected Groups', zh: '受影响群体', ja: '影響を受けるグループ' }, required: false, type: 'text' },
    ],
  },

  // IP Legal
  copyright: {
    key: 'copyright',
    label: {
      vi: 'Đăng ký bản quyền',
      en: 'Copyright Registration',
      zh: '版权登记',
      ja: '著作権登録',
    },
    description: {
      vi: 'Đăng ký bảo hộ bản quyền tác giả.',
      en: 'Register copyright protection.',
      zh: '登记版权保护。',
      ja: '著作権保護を登録します。',
    },
    questions: [
      { key: 'work_type', label: { vi: 'Loại tác phẩm', en: 'Work Type', zh: '作品类型', ja: '著作物種類' }, required: true, type: 'text' },
      { key: 'author_name', label: { vi: 'Tên tác giả', en: 'Author Name', zh: '作者姓名', ja: '著作者名' }, required: true, type: 'text' },
      { key: 'creation_date', label: { vi: 'Ngày sáng tạo', en: 'Creation Date', zh: '创作日期', ja: '創作日' }, required: false, type: 'text' },
    ],
  },
  patent: {
    key: 'patent',
    label: {
      vi: 'Đăng ký sáng chế',
      en: 'Patent Registration',
      zh: '专利申请',
      ja: '特許出願',
    },
    description: {
      vi: 'Đăng ký bảo hộ sáng chế/giải pháp hữu ích.',
      en: 'Register patent/utility solution protection.',
      zh: '申请专利/实用新型保护。',
      ja: '特許/実用新案保護を出願します。',
    },
    questions: [
      { key: 'invention_name', label: { vi: 'Tên sáng chế', en: 'Invention Name', zh: '发明名称', ja: '発明名称' }, required: true, type: 'text' },
      { key: 'inventor_name', label: { vi: 'Tên nhà sáng chế', en: 'Inventor Name', zh: '发明人姓名', ja: '発明者名' }, required: true, type: 'text' },
      { key: 'technical_field', label: { vi: 'Lĩnh vực kỹ thuật', en: 'Technical Field', zh: '技术领域', ja: '技術分野' }, required: true, type: 'text' },
      { key: 'prior_art', label: { vi: 'Giải pháp hiện có', en: 'Existing Solutions', zh: '现有解决方案', ja: '既存の解決策' }, required: false, type: 'textarea' },
    ],
  },

  // Litigation Legal
  lawsuit_filing: {
    key: 'lawsuit_filing',
    label: {
      vi: 'Khởi kiện',
      en: 'Lawsuit Filing',
      zh: '起诉',
      ja: '訴訟提起',
    },
    description: {
      vi: 'Tư vấn và soạn hồ sơ khởi kiện.',
      en: 'Advise and draft lawsuit filing documents.',
      zh: '咨询并起草诉讼文件。',
      ja: '訴訟提起書類のアドバイスと作成を行います。',
    },
    questions: [
      { key: 'dispute_type', label: { vi: 'Loại tranh chấp', en: 'Dispute Type', zh: '争议类型', ja: '紛争種類' }, required: true, type: 'text' },
      { key: 'defendant', label: { vi: 'Bị đơn', en: 'Defendant', zh: '被告', ja: '被告' }, required: true, type: 'text' },
      { key: 'claims', label: { vi: 'Yêu cầu khởi kiện', en: 'Claims Sought', zh: '诉讼请求', ja: '請求内容' }, required: true, type: 'textarea' },
      { key: 'evidence', label: { vi: 'Chứng cứ hiện có', en: 'Available Evidence', zh: '现有证据', ja: '入手可能な証拠' }, required: false, type: 'textarea' },
    ],
  },
  settlement_agreement: {
    key: 'settlement_agreement',
    label: {
      vi: 'Thỏa thuận hòa giải',
      en: 'Settlement Agreement',
      zh: '和解协议',
      ja: '和解契約',
    },
    description: {
      vi: 'Soạn thỏa thuận hòa giải giữa các bên tranh chấp.',
      en: 'Draft settlement agreement between disputing parties.',
      zh: '起草争议各方之间的和解协议。',
      ja: '紛争当事者間の和解契約書を作成します。',
    },
    questions: [
      { key: 'parties', label: { vi: 'Các bên tham gia', en: 'Parties/Entity Names', zh: '参与方', ja: '当事者' }, required: true, type: 'text' },
      { key: 'dispute_summary', label: { vi: 'Tóm tắt tranh chấp', en: 'Dispute Summary', zh: '争议摘要', ja: '紛争概要' }, required: true, type: 'textarea' },
      { key: 'settlement_terms', label: { vi: 'Điều khoản hòa giải', en: 'Mediation Terms', zh: '调解条款', ja: '調停条件' }, required: true, type: 'textarea' },
    ],
  },
  litigation_consultation: {
    key: 'litigation_consultation',
    label: {
      vi: 'Tư vấn tranh tụng',
      en: 'Litigation Consultation',
      zh: '诉讼咨询',
      ja: '訴訟相談',
    },
    description: {
      vi: 'Tư vấn chiến lược và phương án tranh tụng.',
      en: 'Advise on litigation strategy and options.',
      zh: '就诉讼策略和方案提供咨询。',
      ja: '訴訟戦略と選択肢についてアドバイスを提供します。',
    },
    questions: [
      { key: 'case_type', label: { vi: 'Loại vụ việc', en: 'Case Type', zh: '案件类型', ja: '案件種類' }, required: true, type: 'text' },
      { key: 'current_stage', label: { vi: 'Giai đoạn hiện tại', en: 'Current Stage', zh: '当前阶段', ja: '現在の段階' }, required: true, type: 'text' },
      { key: 'concerns', label: { vi: 'Vấn đề cần tư vấn', en: 'Issue Requiring Advice', zh: '需咨询的问题', ja: '相談事項' }, required: true, type: 'textarea' },
    ],
  },

  // Legal Clinic
  internal_consultation: {
    key: 'internal_consultation',
    label: {
      vi: 'Tư vấn nội bộ',
      en: 'Internal Consultation',
      zh: '内部咨询',
      ja: '社内相談',
    },
    description: {
      vi: 'Tư vấn pháp lý nội bộ doanh nghiệp.',
      en: 'Internal legal consultation for business.',
      zh: '企业内部法律咨询。',
      ja: '企業内の法的相談。',
    },
    questions: [
      { key: 'issue_description', label: { vi: 'Mô tả vấn đề', en: 'Problem Description', zh: '问题描述', ja: '問題の説明' }, required: true, type: 'textarea' },
      { key: 'department', label: { vi: 'Bộ phận liên quan', en: 'Relevant Department', zh: '相关部门', ja: '関連部署' }, required: true, type: 'text' },
      { key: 'urgency', label: { vi: 'Mức độ khẩn cấp', en: 'Urgency Level', zh: '紧急程度', ja: '緊急度' }, required: false, type: 'text' },
    ],
  },
  legal_training: {
    key: 'legal_training',
    label: {
      vi: 'Đào tạo pháp luật',
      en: 'Legal Training',
      zh: '法律培训',
      ja: '法務研修',
    },
    description: {
      vi: 'Tổ chức đào tạo pháp luật cho nhân viên.',
      en: 'Organize legal training for employees.',
      zh: '为员工组织法律培训。',
      ja: '従業員向けの法務研修を組織します。',
    },
    questions: [
      { key: 'topic', label: { vi: 'Chủ đề đào tạo', en: 'Training Topic', zh: '培训主题', ja: '研修テーマ' }, required: true, type: 'text' },
      { key: 'participants', label: { vi: 'Số lượng người tham gia', en: 'Number of Participants', zh: '参与人数', ja: '参加人数' }, required: true, type: 'text' },
      { key: 'duration', label: { vi: 'Thời lượng dự kiến', en: 'Expected Duration', zh: '预计时长', ja: '想定時間' }, required: false, type: 'text' },
    ],
  },

  // Law Student
  case_study: {
    key: 'case_study',
    label: {
      vi: 'Nghiên cứu tình huống',
      en: 'Case Study',
      zh: '案例研究',
      ja: '事例研究',
    },
    description: {
      vi: 'Phân tích tình huống pháp lý thực tế cho mục đích học tập.',
      en: 'Analyze real legal scenarios for learning purposes.',
      zh: '分析真实法律场景用于学习。',
      ja: '学習目的で実際の法的シナリオを分析します。',
    },
    questions: [
      { key: 'case_title', label: { vi: 'Tên tình huống', en: 'Scenario Name', zh: '情景名称', ja: 'シナリオ名' }, required: true, type: 'text' },
      { key: 'legal_area', label: { vi: 'Lĩnh vực pháp lý liên quan', en: 'Related Legal Areas', zh: '相关法律领域', ja: '関連法分野' }, required: true, type: 'text' },
      { key: 'key_issues', label: { vi: 'Vấn đề chính cần phân tích', en: 'Core Issue to Analyze', zh: '需分析的核心问题', ja: '分析すべき主要論点' }, required: true, type: 'textarea' },
      { key: 'learning_objectives', label: { vi: 'Mục tiêu học tập', en: 'Learning Objectives', zh: '学习目标', ja: '学習目標' }, required: false, type: 'textarea' },
    ],
  },
  legal_research: {
    key: 'legal_research',
    label: {
      vi: 'Nghiên cứu pháp luật',
      en: 'Legal Research',
      zh: '法律研究',
      ja: '法律研究',
    },
    description: {
      vi: 'Nghiên cứu chuyên sâu về các vấn đề pháp lý và học thuyết.',
      en: 'In-depth research on legal issues and doctrines.',
      zh: '对法律问题和学说的深入研究。',
      ja: '法的問題と理論に関する詳細な研究。',
    },
    questions: [
      { key: 'research_question', label: { vi: 'Câu hỏi nghiên cứu', en: 'Research Question', zh: '研究问题', ja: 'リサーチクエスチョン' }, required: true, type: 'textarea' },
      { key: 'jurisdiction', label: { vi: 'Phạm vi pháp lý', en: 'Legal Scope', zh: '法律范围', ja: '法的範囲' }, required: true, type: 'text' },
      { key: 'methodology', label: { vi: 'Phương pháp nghiên cứu', en: 'Research Method', zh: '研究方法', ja: '研究方法' }, required: false, type: 'textarea' },
    ],
  },

  // Legal Builder Hub
  template_engine: {
    key: 'template_engine',
    label: {
      vi: 'Tạo mẫu hợp đồng',
      en: 'Contract Template Builder',
      zh: '合同模板生成器',
      ja: '契約テンプレートビルダー',
    },
    description: {
      vi: 'Tạo mẫu hợp đồng tùy chỉnh.',
      en: 'Create customized contract templates.',
      zh: '创建定制合同模板。',
      ja: 'カスタマイズされた契約テンプレートを作成します。',
    },
    questions: [
      { key: 'contract_type', label: { vi: 'Loại hợp đồng', en: 'Contract Type', zh: '合同类型', ja: '契約タイプ' }, required: true, type: 'text' },
      { key: 'variables', label: { vi: 'Các biến cần tùy chỉnh', en: 'Variables to Customize', zh: '需自定义的变量', ja: 'カスタマイズ変数' }, required: true, type: 'textarea' },
      { key: 'language', label: { vi: 'Ngôn ngữ hợp đồng', en: 'Contract Language', zh: '合同语言', ja: '契約言語' }, required: false, type: 'text' },
    ],
  },
  workflow_builder: {
    key: 'workflow_builder',
    label: {
      vi: 'Xây dựng quy trình',
      en: 'Workflow Builder',
      zh: '工作流构建器',
      ja: 'ワークフロービルダー',
    },
    description: {
      vi: 'Thiết kế quy trình xử lý pháp lý tùy chỉnh.',
      en: 'Design customized legal processing workflows.',
      zh: '设计定制的法律处理工作流。',
      ja: 'カスタマイズされた法務処理ワークフローを設計します。',
    },
    questions: [
      { key: 'process_name', label: { vi: 'Tên quy trình', en: 'Process Name', zh: '流程名称', ja: 'プロセス名' }, required: true, type: 'text' },
      { key: 'steps', label: { vi: 'Các bước trong quy trình', en: 'Process Steps', zh: '流程步骤', ja: 'プロセス手順' }, required: true, type: 'textarea' },
      { key: 'approvers', label: { vi: 'Người phê duyệt', en: 'Approver', zh: '审批人', ja: '承認者' }, required: false, type: 'text' },
    ],
  },

  // External Plugins
  cocounsel: {
    key: 'cocounsel',
    label: {
      vi: 'Đồng tư vấn',
      en: 'Co-Counsel',
      zh: '联合顾问',
      ja: '共同顧問',
    },
    description: {
      vi: 'Phối hợp với luật sư bên ngoài.',
      en: 'Coordinate with external counsel.',
      zh: '与外部律师协调。',
      ja: '外部弁護士と調整します。',
    },
    questions: [
      { key: 'counsel_name', label: { vi: 'Tên luật sư/hãng luật', en: 'Lawyer/Law Firm Name', zh: '律师/律所名称', ja: '弁護士・法律事務所名' }, required: true, type: 'text' },
      { key: 'matter', label: { vi: 'Vụ việc phối hợp', en: 'Joint Matter', zh: '协作事项', ja: '連携案件' }, required: true, type: 'textarea' },
      { key: 'scope', label: { vi: 'Phạm vi công việc', en: 'Scope of Work', zh: '工作范围', ja: '業務範囲' }, required: false, type: 'textarea' },
    ],
  },
  legal_research_tools: {
    key: 'legal_research_tools',
    label: {
      vi: 'Công cụ nghiên cứu pháp lý',
      en: 'Legal Research Tools',
      zh: '法律研究工具',
      ja: '法務調査ツール',
    },
    description: {
      vi: 'Sử dụng công cụ nghiên cứu pháp lý chuyên sâu.',
      en: 'Use advanced legal research tools.',
      zh: '使用高级法律研究工具。',
      ja: '高度な法務調査ツールを使用します。',
    },
    questions: [
      { key: 'research_topic', label: { vi: 'Chủ đề nghiên cứu', en: 'Research Topic', zh: '研究主题', ja: '研究テーマ' }, required: true, type: 'textarea' },
      { key: 'jurisdiction', label: { vi: 'Phạm vi pháp lý', en: 'Legal Scope', zh: '法律范围', ja: '法的範囲' }, required: true, type: 'text' },
      { key: 'time_period', label: { vi: 'Thời gian cần nghiên cứu', en: 'Research Duration Needed', zh: '所需研究时间', ja: '必要研究期間' }, required: false, type: 'text' },
    ],
  },
};

/**
 * Legal domains with 2-layer service selection
 * 13 domains total
 */
export const SEED_LEGAL_DOMAINS: Record<string, LegalDomainDefinition> = {
  'commercial-legal': {
    key: 'commercial-legal',
    label: {
      vi: 'Thương mại',
      en: 'Commercial Legal',
      zh: '商事法律',
      ja: '商事法務',
    },
    icon: 'Briefcase',
    description: {
      vi: 'Hợp đồng thương mại, NDA, rà soát hợp đồng',
      en: 'Commercial contracts, NDA, contract review',
      zh: '商业合同、保密协议、合同审查',
      ja: '商事契約、NDA、契約レビュー',
    },
    matterTypeKeys: ['distribution_contract', 'nda', 'commercial_review', 'agency_contract'],
  },
  'corporate-legal': {
    key: 'corporate-legal',
    label: {
      vi: 'Doanh nghiệp',
      en: 'Corporate Legal',
      zh: '企业法律',
      ja: '企業法務',
    },
    icon: 'Building',
    description: {
      vi: 'Thành lập công ty, thỏa thuận cổ đông, M&A',
      en: 'Incorporation, shareholder agreements, M&A',
      zh: '公司成立、股东协议、并购',
      ja: '会社設立、株主契約、M&A',
    },
    matterTypeKeys: ['incorporation', 'shareholder_agreement', 'm_and_a'],
  },
  'employment-legal': {
    key: 'employment-legal',
    label: {
      vi: 'Lao động',
      en: 'Employment Legal',
      zh: '劳动法律',
      ja: '労働法務',
    },
    icon: 'Users',
    description: {
      vi: 'Hợp đồng lao động, nội quy, tranh chấp',
      en: 'Labor contracts, regulations, disputes',
      zh: '劳动合同、规章、争议',
      ja: '労働契約、就業規則、紛争',
    },
    matterTypeKeys: ['labor_contract', 'internal_regulations', 'labor_dispute'],
  },
  'privacy-legal': {
    key: 'privacy-legal',
    label: {
      vi: 'Bảo mật dữ liệu',
      en: 'Data Privacy',
      zh: '数据隐私',
      ja: 'データプライバシー',
    },
    icon: 'Shield',
    description: {
      vi: 'Chính sách bảo mật, DPIA, thỏa thuận xử lý',
      en: 'Privacy policy, DPIA, data processing agreement',
      zh: '隐私政策、DPIA、数据处理协议',
      ja: 'プライバシーポリシー、DPIA、データ処理契約',
    },
    matterTypeKeys: ['privacy_policy', 'dpia', 'data_processing_agreement'],
  },
  'product-legal': {
    key: 'product-legal',
    label: {
      vi: 'Sản phẩm',
      en: 'Product Legal',
      zh: '产品法律',
      ja: '製品法務',
    },
    icon: 'Package',
    description: {
      vi: 'Điều khoản dịch vụ, chính sách đổi trả, trách nhiệm',
      en: 'Terms of service, return policy, product liability',
      zh: '服务条款、退货政策、产品责任',
      ja: '利用規約、返品ポリシー、製造物責任',
    },
    matterTypeKeys: ['terms_of_service', 'return_policy', 'product_liability'],
  },
  'regulatory-legal': {
    key: 'regulatory-legal',
    label: {
      vi: 'Tuân thủ',
      en: 'Regulatory Compliance',
      zh: '监管合规',
      ja: '規制コンプライアンス',
    },
    icon: 'FileCheck',
    description: {
      vi: 'Giấy phép kinh doanh, báo cáo tuân thủ',
      en: 'Business license, compliance report',
      zh: '营业执照、合规报告',
      ja: '営業許可、コンプライアンスレポート',
    },
    matterTypeKeys: ['business_license', 'compliance_report'],
  },
  'ai-governance-legal': {
    key: 'ai-governance-legal',
    label: {
      vi: 'Quản trị AI',
      en: 'AI Governance',
      zh: 'AI治理',
      ja: 'AIガバナンス',
    },
    icon: 'Bot',
    description: {
      vi: 'Chính sách AI, kiểm toán thuật toán',
      en: 'AI policy, algorithm audit',
      zh: 'AI政策、算法审计',
      ja: 'AIポリシー、アルゴリズム監査',
    },
    matterTypeKeys: ['ai_policy', 'algorithm_audit'],
  },
  'ip-legal': {
    key: 'ip-legal',
    label: {
      vi: 'Sở hữu trí tuệ',
      en: 'Intellectual Property',
      zh: '知识产权',
      ja: '知的財産',
    },
    icon: 'Lightbulb',
    description: {
      vi: 'Nhãn hiệu, bản quyền, sáng chế',
      en: 'Trademark, copyright, patent',
      zh: '商标、版权、专利',
      ja: '商標、著作権、特許',
    },
    matterTypeKeys: ['trademark_registration', 'copyright', 'patent'],
  },
  'litigation-legal': {
    key: 'litigation-legal',
    label: {
      vi: 'Tranh tụng',
      en: 'Litigation',
      zh: '诉讼',
      ja: '訴訟',
    },
    icon: 'Scale',
    description: {
      vi: 'Khởi kiện, hòa giải, tư vấn tranh tụng',
      en: 'Lawsuit filing, settlement, litigation consultation',
      zh: '起诉、和解、诉讼咨询',
      ja: '訴訟提起、和解、訴訟相談',
    },
    matterTypeKeys: ['lawsuit_filing', 'settlement_agreement', 'litigation_consultation'],
  },
  'legal-clinic': {
    key: 'legal-clinic',
    label: {
      vi: 'Phòng pháp chế',
      en: 'Legal Clinic',
      zh: '法务诊所',
      ja: '法務クリニック',
    },
    icon: 'Heart',
    description: {
      vi: 'Tư vấn nội bộ, đào tạo pháp luật',
      en: 'Internal consultation, legal training',
      zh: '内部咨询、法律培训',
      ja: '社内相談、法務研修',
    },
    matterTypeKeys: ['internal_consultation', 'legal_training'],
  },
  'law-student': {
    key: 'law-student',
    label: {
      vi: 'Sinh viên luật',
      en: 'Law Student',
      zh: '法学生',
      ja: '法学生',
    },
    icon: 'GraduationCap',
    description: {
      vi: 'Nghiên cứu tình huống, nghiên cứu pháp luật',
      en: 'Case study, legal research',
      zh: '案例研究、法律研究',
      ja: '事例研究、法律研究',
    },
    matterTypeKeys: ['case_study', 'legal_research'],
  },
  'legal-builder-hub': {
    key: 'legal-builder-hub',
    label: {
      vi: 'Xây dựng pháp lý',
      en: 'Legal Builder Hub',
      zh: '法律构建中心',
      ja: '法律ビルダーハブ',
    },
    icon: 'Hammer',
    description: {
      vi: 'Tạo mẫu hợp đồng, xây dựng quy trình',
      en: 'Contract template builder, workflow builder',
      zh: '合同模板生成器、工作流构建器',
      ja: '契約テンプレートビルダー、ワークフロービルダー',
    },
    matterTypeKeys: ['template_engine', 'workflow_builder'],
  },
  'external-plugins': {
    key: 'external-plugins',
    label: {
      vi: 'Plugin bên ngoài',
      en: 'External Plugins',
      zh: '外部插件',
      ja: '外部プラグイン',
    },
    icon: 'Plug',
    description: {
      vi: 'Đồng tư vấn, công cụ nghiên cứu pháp lý',
      en: 'Co-counsel, legal research tools',
      zh: '联合顾问、法律研究工具',
      ja: '共同顧問、法務調査ツール',
    },
    matterTypeKeys: ['cocounsel', 'legal_research_tools'],
  },
};

/**
 * Get all legal domains as array
 */
export function getLegalDomains(): LegalDomainDefinition[] {
  return Object.values(SEED_LEGAL_DOMAINS);
}

/**
 * Get domain containing a specific service type
 */
export function getDomainByServiceType(serviceTypeKey: string): LegalDomainDefinition | null {
  for (const domain of Object.values(SEED_LEGAL_DOMAINS)) {
    if (domain.matterTypeKeys.includes(serviceTypeKey)) {
      return domain;
    }
  }
  return null;
}

/**
 * Get service types for a specific domain
 */
export function getServiceTypesByDomain(domainKey: string): ServiceTypeDefinition[] {
  const domain = SEED_LEGAL_DOMAINS[domainKey];
  if (!domain) return [];

  return domain.matterTypeKeys
    .map((key) => SEED_MATTER_TYPES[key])
    .filter((type): type is ServiceTypeDefinition => type !== undefined);
}

/**
 * Get questions for a specific service type
 */
export function getMatterQuestions(serviceTypeKey: string): QuestionDefinition[] {
  const serviceType = SEED_MATTER_TYPES[serviceTypeKey];
  if (!serviceType) return [];
  return serviceType.questions;
}

/**
 * Get service type by key
 */
export function getServiceType(key: string): ServiceTypeDefinition | null {
  return SEED_MATTER_TYPES[key] || null;
}
