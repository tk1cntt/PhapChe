/**
 * Transform question labels in seed-legal-domains.ts
 * from string to multilingual objects { vi, en, zh, ja }
 */
import { readFileSync, writeFileSync } from 'fs';

// Multilingual dictionary for all 104 question labels
const DICT = {
  'Vị trí công việc': { vi: 'Vị trí công việc', en: 'Job Position', zh: '职位', ja: '職位' },
  'Mức lương hoặc thỏa thuận lương': { vi: 'Mức lương hoặc thỏa thuận lương', en: 'Salary or compensation agreement', zh: '薪资或薪酬协议', ja: '給与または報酬合意' },
  'Thời hạn hợp đồng': { vi: 'Thời hạn hợp đồng', en: 'Contract Duration', zh: '合同期限', ja: '契約期間' },
  'Địa điểm làm việc': { vi: 'Địa điểm làm việc', en: 'Workplace Location', zh: '工作地点', ja: '勤務地' },
  'Tên đối tác đại lý': { vi: 'Tên đối tác đại lý', en: 'Agent/Partner Name', zh: '代理/合作伙伴名称', ja: '代理パートナー名' },
  'Tỷ lệ hoa hồng hoặc chiết khấu': { vi: 'Tỷ lệ hoa hồng hoặc chiết khấu', en: 'Commission Rate or Discount', zh: '佣金率或折扣', ja: '手数料率または割引' },
  'Yêu cầu đặc biệt khác': { vi: 'Yêu cầu đặc biệt khác', en: 'Other Special Requirements', zh: '其他特殊要求', ja: 'その他特別要件' },
  'Tên nhãn hiệu': { vi: 'Tên nhãn hiệu', en: 'Trademark Name', zh: '商标名称', ja: '商標名' },
  'Tên chủ sở hữu dự kiến': { vi: 'Tên chủ sở hữu dự kiến', en: 'Prospective Owner Name', zh: '预期所有人名称', ja: '予定所有者名' },
  'Nhóm sản phẩm hoặc dịch vụ': { vi: 'Nhóm sản phẩm hoặc dịch vụ', en: 'Product or Service Group', zh: '产品或服务组别', ja: '製品またはサービスクラス' },
  'Thông tin đã sử dụng nhãn hiệu': { vi: 'Thông tin đã sử dụng nhãn hiệu', en: 'Prior Trademark Use Info', zh: '在先商标使用信息', ja: '商標の先行使用情報' },
  'Tóm tắt nhu cầu hỗ trợ': { vi: 'Tóm tắt nhu cầu hỗ trợ', en: 'Support Request Summary', zh: '支持需求摘要', ja: 'サポート依頼概要' },
  'Kết quả mong muốn': { vi: 'Kết quả mong muốn', en: 'Desired Outcome', zh: '期望结果', ja: '望ましい結果' },
  'Tên nhà phân phối': { vi: 'Tên nhà phân phối', en: 'Distributor Name', zh: '经销商名称', ja: '販売代理店名' },
  'Sản phẩm/dịch vụ phân phối': { vi: 'Sản phẩm/dịch vụ phân phối', en: 'Distributed Product/Service', zh: '分销产品/服务', ja: '販売製品・サービス' },
  'Khu vực phân phối': { vi: 'Khu vực phân phối', en: 'Distribution Territory', zh: '分销区域', ja: '販売地域' },
  'Các bên tham gia': { vi: 'Các bên tham gia', en: 'Parties/Entity Names', zh: '参与方', ja: '当事者' },
  'Loại thông tin cần bảo mật': { vi: 'Loại thông tin cần bảo mật', en: 'Confidential Information Type', zh: '需保密信息类型', ja: '秘密情報の種類' },
  'Thời hạn bảo mật': { vi: 'Thời hạn bảo mật', en: 'Confidentiality Duration', zh: '保密期限', ja: '秘密保持期間' },
  'Loại hợp đồng': { vi: 'Loại hợp đồng', en: 'Contract Type', zh: '合同类型', ja: '契約タイプ' },
  'Vấn đề cần quan tâm': { vi: 'Vấn đề cần quan tâm', en: 'Concerns', zh: '关注问题', ja: '懸念事項' },
  'Tên công ty dự kiến': { vi: 'Tên công ty dự kiến', en: 'Proposed Company Name', zh: '拟定公司名称', ja: '予定会社名' },
  'Loại hình doanh nghiệp': { vi: 'Loại hình doanh nghiệp', en: 'Business Entity Type', zh: '企业类型', ja: '法人形態' },
  'Vốn điều lệ': { vi: 'Vốn điều lệ', en: 'Charter Capital', zh: '注册资本', ja: '資本金' },
  'Thông tin sáng lập viên': { vi: 'Thông tin sáng lập viên', en: 'Founder Information', zh: '创始人信息', ja: '発起人情報' },
  'Danh sách cổ đông': { vi: 'Danh sách cổ đông', en: 'Shareholder List', zh: '股东名单', ja: '株主一覧' },
  'Cơ cấu sở hữu': { vi: 'Cơ cấu sở hữu', en: 'Ownership Structure', zh: '所有权结构', ja: '所有構造' },
  'Quyền biểu quyết': { vi: 'Quyền biểu quyết', en: 'Voting Rights', zh: '表决权', ja: '議決権' },
  'Mục đích xử lý': { vi: 'Mục đích xử lý', en: 'Processing Purpose', zh: '处理目的', ja: '処理目的' },
  'Bên kiểm soát dữ liệu': { vi: 'Bên kiểm soát dữ liệu', en: 'Data Controller', zh: '数据控制者', ja: 'データ管理者' },
  'Bên xử lý dữ liệu': { vi: 'Bên xử lý dữ liệu', en: 'Data Processor', zh: '数据处理者', ja: 'データ処理者' },
  'Bên thứ ba chia sẻ dữ liệu': { vi: 'Bên thứ ba chia sẻ dữ liệu', en: 'Third-party Data Recipients', zh: '第三方数据接收方', ja: '第三者データ受領者' },
  'Loại dữ liệu thu thập': { vi: 'Loại dữ liệu thu thập', en: 'Data Categories Collected', zh: '收集的数据类别', ja: '収集データカテゴリ' },
  'Danh mục dữ liệu': { vi: 'Danh mục dữ liệu', en: 'Data Inventory', zh: '数据清单', ja: 'データ一覧' },
  'Đối tượng dữ liệu': { vi: 'Đối tượng dữ liệu', en: 'Data Subjects', zh: '数据主体', ja: 'データ主体' },
  'Hoạt động xử lý dữ liệu': { vi: 'Hoạt động xử lý dữ liệu', en: 'Data Processing Activities', zh: '数据处理活动', ja: 'データ処理活動' },
  'Tên sản phẩm': { vi: 'Tên sản phẩm', en: 'Product Name', zh: '产品名称', ja: '製品名' },
  'Điều khoản thanh toán': { vi: 'Điều khoản thanh toán', en: 'Payment Terms', zh: '付款条款', ja: '支払条件' },
  'Điều kiện đổi trả': { vi: 'Điều kiện đổi trả', en: 'Return/Exchange Conditions', zh: '退换条件', ja: '返品・交換条件' },
  'Thời hạn đổi trả': { vi: 'Thời hạn đổi trả', en: 'Return/Exchange Period', zh: '退换期限', ja: '返品交換期間' },
  'Mức độ rủi ro dự kiến': { vi: 'Mức độ rủi ro dự kiến', en: 'Expected Risk Level', zh: '预期风险等级', ja: '想定リスクレベル' },
  'Lĩnh vực pháp lý liên quan': { vi: 'Lĩnh vực pháp lý liên quan', en: 'Related Legal Areas', zh: '相关法律领域', ja: '関連法分野' },
  'Loại giao dịch': { vi: 'Loại giao dịch', en: 'Transaction Type', zh: '交易类型', ja: '取引タイプ' },
  'Giá trị giao dịch': { vi: 'Giá trị giao dịch', en: 'Transaction Value', zh: '交易金额', ja: '取引金額' },
  'Công ty mục tiêu': { vi: 'Công ty mục tiêu', en: 'Target Company', zh: '目标公司', ja: '対象会社' },
  'Loại hình kinh doanh': { vi: 'Loại hình kinh doanh', en: 'Business Type', zh: '业务类型', ja: '事業種類' },
  'Loại giấy phép cần': { vi: 'Loại giấy phép cần', en: 'License Type Required', zh: '所需许可类型', ja: '必要許可種類' },
  'Địa điểm kinh doanh': { vi: 'Địa điểm kinh doanh', en: 'Business Location', zh: '经营地点', ja: '事業所所在地' },
  'Lĩnh vực cần đánh giá': { vi: 'Lĩnh vực cần đánh giá', en: 'Compliance Area to Assess', zh: '需评估的合规领域', ja: '評価対象コンプライアンス分野' },
  'Tình trạng hiện tại': { vi: 'Tình trạng hiện tại', en: 'Current Status', zh: '当前状况', ja: '現状' },
  'Kỳ đánh giá': { vi: 'Kỳ đánh giá', en: 'Assessment Period', zh: '评估期间', ja: '評価期間' },
  'Mục đích sử dụng AI': { vi: 'Mục đích sử dụng AI', en: 'AI Use Cases', zh: 'AI用例', ja: 'AI利用目的' },
  'Dữ liệu AI sử dụng': { vi: 'Dữ liệu AI sử dụng', en: 'Data Used by AI', zh: 'AI使用的数据', ja: 'AI使用データ' },
  'Lo ngại về rủi ro': { vi: 'Lo ngại về rủi ro', en: 'Risk Concerns', zh: '风险顾虑', ja: 'リスク懸念' },
  'Loại thuật toán': { vi: 'Loại thuật toán', en: 'Algorithm Type', zh: '算法类型', ja: 'アルゴリズム種類' },
  'Quyết định thuật toán đưa ra': { vi: 'Quyết định thuật toán đưa ra', en: 'Algorithmic Decisions Made', zh: '算法做出的决定', ja: 'アルゴリズムによる判断' },
  'Nhóm đối tượng bị ảnh hưởng': { vi: 'Nhóm đối tượng bị ảnh hưởng', en: 'Affected Groups', zh: '受影响群体', ja: '影響を受けるグループ' },
  'Loại tác phẩm': { vi: 'Loại tác phẩm', en: 'Work Type', zh: '作品类型', ja: '著作物種類' },
  'Tên tác giả': { vi: 'Tên tác giả', en: 'Author Name', zh: '作者姓名', ja: '著作者名' },
  'Ngày sáng tạo': { vi: 'Ngày sáng tạo', en: 'Creation Date', zh: '创作日期', ja: '創作日' },
  'Tên sáng chế': { vi: 'Tên sáng chế', en: 'Invention Name', zh: '发明名称', ja: '発明名称' },
  'Tên nhà sáng chế': { vi: 'Tên nhà sáng chế', en: 'Inventor Name', zh: '发明人姓名', ja: '発明者名' },
  'Lĩnh vực kỹ thuật': { vi: 'Lĩnh vực kỹ thuật', en: 'Technical Field', zh: '技术领域', ja: '技術分野' },
  'Giải pháp hiện có': { vi: 'Giải pháp hiện có', en: 'Existing Solutions', zh: '现有解决方案', ja: '既存の解決策' },
  'Mô tả vấn đề': { vi: 'Mô tả vấn đề', en: 'Problem Description', zh: '问题描述', ja: '問題の説明' },
  'Tên sản phẩm': { vi: 'Tên sản phẩm', en: 'Product Name', zh: '产品名称', ja: '製品名' },
  'Tên dịch vụ/sản phẩm': { vi: 'Tên dịch vụ/sản phẩm', en: 'Service/Product Name', zh: '服务/产品名称', ja: 'サービス・製品名' },
  'Ngôn ngữ hợp đồng': { vi: 'Ngôn ngữ hợp đồng', en: 'Contract Language', zh: '合同语言', ja: '契約言語' },
  'Chế độ làm việc': { vi: 'Chế độ làm việc', en: 'Work Mode', zh: '工作模式', ja: '勤務形態' },
  'Phạm vi công việc': { vi: 'Phạm vi công việc', en: 'Scope of Work', zh: '工作范围', ja: '業務範囲' },
  'Bộ phận liên quan': { vi: 'Bộ phận liên quan', en: 'Relevant Department', zh: '相关部门', ja: '関連部署' },
  'Quy định kỷ luật': { vi: 'Quy định kỷ luật', en: 'Disciplinary Rules', zh: '纪律规定', ja: '懲戒規定' },
  'Loại vụ việc': { vi: 'Loại vụ việc', en: 'Case Type', zh: '案件类型', ja: '案件種類' },
  'Tên tình huống': { vi: 'Tên tình huống', en: 'Scenario Name', zh: '情景名称', ja: 'シナリオ名' },
  'Số lượng người tham gia': { vi: 'Số lượng người tham gia', en: 'Number of Participants', zh: '参与人数', ja: '参加人数' },
  'Thời lượng dự kiến': { vi: 'Thời lượng dự kiến', en: 'Expected Duration', zh: '预计时长', ja: '想定時間' },
  'Mục tiêu học tập': { vi: 'Mục tiêu học tập', en: 'Learning Objectives', zh: '学习目标', ja: '学習目標' },
  'Giai đoạn hiện tại': { vi: 'Giai đoạn hiện tại', en: 'Current Stage', zh: '当前阶段', ja: '現在の段階' },
  'Các bước trong quy trình': { vi: 'Các bước trong quy trình', en: 'Process Steps', zh: '流程步骤', ja: 'プロセス手順' },
  'Người phê duyệt': { vi: 'Người phê duyệt', en: 'Approver', zh: '审批人', ja: '承認者' },
  'Loại người dùng': { vi: 'Loại người dùng', en: 'User Type', zh: '用户类型', ja: 'ユーザータイプ' },
  'Câu hỏi nghiên cứu': { vi: 'Câu hỏi nghiên cứu', en: 'Research Question', zh: '研究问题', ja: 'リサーチクエスチョン' },
  'Phương pháp nghiên cứu': { vi: 'Phương pháp nghiên cứu', en: 'Research Method', zh: '研究方法', ja: '研究方法' },
  'Phạm vi pháp lý': { vi: 'Phạm vi pháp lý', en: 'Legal Scope', zh: '法律范围', ja: '法的範囲' },
  'Chủ đề nghiên cứu': { vi: 'Chủ đề nghiên cứu', en: 'Research Topic', zh: '研究主题', ja: '研究テーマ' },
  'Thời gian cần nghiên cứu': { vi: 'Thời gian cần nghiên cứu', en: 'Research Duration Needed', zh: '所需研究时间', ja: '必要研究期間' },
  'Vấn đề chính cần phân tích': { vi: 'Vấn đề chính cần phân tích', en: 'Core Issue to Analyze', zh: '需分析的核心问题', ja: '分析すべき主要論点' },
  'Điều khoản hòa giải': { vi: 'Điều khoản hòa giải', en: 'Mediation Terms', zh: '调解条款', ja: '調停条件' },
  'Loại tranh chấp': { vi: 'Loại tranh chấp', en: 'Dispute Type', zh: '争议类型', ja: '紛争種類' },
  'Thiệt hại ước tính': { vi: 'Thiệt hại ước tính', en: 'Estimated Damages', zh: '预估损失', ja: '推定損害額' },
  'Tóm tắt tranh chấp': { vi: 'Tóm tắt tranh chấp', en: 'Dispute Summary', zh: '争议摘要', ja: '紛争概要' },
  'Chứng cứ hiện có': { vi: 'Chứng cứ hiện có', en: 'Available Evidence', zh: '现有证据', ja: '入手可能な証拠' },
  'Bị đơn': { vi: 'Bị đơn', en: 'Defendant', zh: '被告', ja: '被告' },
  'Yêu cầu khởi kiện': { vi: 'Yêu cầu khởi kiện', en: 'Claims Sought', zh: '诉讼请求', ja: '請求内容' },
  'Tên luật sư/hãng luật': { vi: 'Tên luật sư/hãng luật', en: 'Lawyer/Law Firm Name', zh: '律师/律所名称', ja: '弁護士・法律事務所名' },
  'Vấn đề cần tư vấn': { vi: 'Vấn đề cần tư vấn', en: 'Issue Requiring Advice', zh: '需咨询的问题', ja: '相談事項' },
  'Vụ việc phối hợp': { vi: 'Vụ việc phối hợp', en: 'Joint Matter', zh: '协作事项', ja: '連携案件' },
  'Mức độ khẩn cấp': { vi: 'Mức độ khẩn cấp', en: 'Urgency Level', zh: '紧急程度', ja: '緊急度' },
  'Chủ đề đào tạo': { vi: 'Chủ đề đào tạo', en: 'Training Topic', zh: '培训主题', ja: '研修テーマ' },
  'Các bên liên quan': { vi: 'Các bên liên quan', en: 'Relevant Parties', zh: '相关方', ja: '関係者' },
  'Các biến cần tùy chỉnh': { vi: 'Các biến cần tùy chỉnh', en: 'Variables to Customize', zh: '需自定义的变量', ja: 'カスタマイズ変数' },
  'Tên quy trình': { vi: 'Tên quy trình', en: 'Process Name', zh: '流程名称', ja: 'プロセス名' },
  'Loại sản phẩm/dịch vụ': { vi: 'Loại sản phẩm/dịch vụ', en: 'Product/Service Type', zh: '产品/服务类型', ja: '製品・サービス種類' },
  'Quy mô công ty (số nhân viên)': { vi: 'Quy mô công ty (số nhân viên)', en: 'Company Size (employees)', zh: '公司规模（员工数）', ja: '会社規模（従業員数）' },
  'Mô tả sự cố': { vi: 'Mô tả sự cố', en: 'Incident Description', zh: '事件描述', ja: 'インシデント説明' },
};

function transform(viLabel) {
  const entry = DICT[viLabel];
  if (!entry) {
    console.warn(`MISSING: ${viLabel}`);
    return viLabel;
  }
  return `{ vi: '${entry.vi}', en: '${entry.en}', zh: '${entry.zh}', ja: '${entry.ja}' }`;
}

let src = readFileSync('src/lib/i18n/seed-legal-domains.ts', 'utf-8');

// Step 1: Update QuestionDefinition interface
src = src.replace(
  "export interface QuestionDefinition {\n  key: string;\n  label: string;\n  required: boolean;\n  type: 'text' | 'textarea';\n}",
  "export interface QuestionDefinition {\n  key: string;\n  label: MultilingualString;\n  required: boolean;\n  type: 'text' | 'textarea';\n}"
);

// Step 2: Replace all label: '...' with multilingual objects
let count = 0;
// Service-type labels are multiline `label: { ... }` — don't touch those.
// Question labels are single-line `label: 'Vị trí',` followed by comma.
src = src.replace(/(label: )'([^']+)'(,\s*(?:required|type):)/g, (match, prefix, label, suffix) => {
  count++;
  const result = transform(label);
  return `${prefix}${result}${suffix}`;
});

writeFileSync('src/lib/i18n/seed-legal-domains.ts', src, 'utf-8');
console.log(`Transformed ${count} question labels`);
console.log('Done — QuestionDefinition.label is now MultilingualString');
