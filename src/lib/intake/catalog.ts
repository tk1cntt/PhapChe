export type IntakeQuestion = {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'textarea';
};

export type MatterCatalogItem = {
  key: string;
  label: string;
  description: string;
  schemaVersion: string;
  questions: readonly IntakeQuestion[];
};

export const MATTER_CATALOG = [
  {
    key: 'agency_contract',
    label: 'Soạn hợp đồng đại lý',
    description: 'Chuẩn hóa thông tin đối tác, chiết khấu và thời hạn hợp đồng đại lý.',
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'partner_name', label: 'Tên đối tác đại lý', required: true, type: 'text' },
      { key: 'commission_rate', label: 'Tỷ lệ hoa hồng hoặc chiết khấu', required: true, type: 'text' },
      { key: 'contract_term', label: 'Thời hạn hợp đồng', required: true, type: 'text' },
      { key: 'special_terms', label: 'Yêu cầu đặc biệt khác', required: false, type: 'textarea' },
    ],
  },
  {
    key: 'labor_contract',
    label: 'Soạn hợp đồng lao động',
    description: 'Ghi nhận vị trí, lương, thời hạn và điều kiện làm việc chính.',
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'employee_role', label: 'Vị trí công việc', required: true, type: 'text' },
      { key: 'salary', label: 'Mức lương hoặc thỏa thuận lương', required: true, type: 'text' },
      { key: 'contract_term', label: 'Thời hạn hợp đồng', required: true, type: 'text' },
      { key: 'workplace', label: 'Địa điểm làm việc', required: false, type: 'text' },
    ],
  },
  {
    key: 'trademark_registration',
    label: 'Đăng ký nhãn hiệu',
    description: 'Thu thập tên nhãn hiệu, nhóm sản phẩm/dịch vụ và chủ sở hữu.',
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'trademark_name', label: 'Tên nhãn hiệu', required: true, type: 'text' },
      { key: 'owner_name', label: 'Tên chủ sở hữu dự kiến', required: true, type: 'text' },
      { key: 'goods_services', label: 'Nhóm sản phẩm hoặc dịch vụ', required: true, type: 'textarea' },
      { key: 'prior_use', label: 'Thông tin đã sử dụng nhãn hiệu', required: false, type: 'textarea' },
    ],
  },
  {
    key: 'unsupported',
    label: 'Dịch vụ khác / chưa rõ loại việc',
    description: 'Hồ sơ sẽ được chuyển để chuyên viên phân loại trước khi xử lý.',
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'request_summary', label: 'Tóm tắt nhu cầu hỗ trợ', required: true, type: 'textarea' },
      { key: 'desired_outcome', label: 'Kết quả mong muốn', required: false, type: 'textarea' },
    ],
  },
] as const satisfies readonly MatterCatalogItem[];

export type MatterTypeKey = (typeof MATTER_CATALOG)[number]['key'];

export function getMatterType(matterTypeKey: string): MatterCatalogItem | null {
  const matterType = MATTER_CATALOG.find((item) => item.key === matterTypeKey);
  return matterType ? { ...matterType, questions: matterType.questions.map((question) => ({ ...question })) } : null;
}

export function getMatterQuestions(matterTypeKey: string): IntakeQuestion[] {
  return getMatterType(matterTypeKey)?.questions.map((question) => ({ ...question })) ?? [];
}
