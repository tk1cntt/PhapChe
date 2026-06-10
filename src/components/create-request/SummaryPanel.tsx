'use client';

interface SummaryPanelProps {
  selectedService: string;
  workspaceName: string;
  locale?: string;
}

const SERVICE_NAMES = {
  'agent-contract': {
    vi: 'Soạn hợp đồng đại lý',
    en: 'Draft Agency Contract',
    zh: '起草代理合同',
    ja: '代理契約書の作成',
  },
  'labor-contract': {
    vi: 'Soạn hợp đồng lao động',
    en: 'Draft Labor Contract',
    zh: '起草劳动合同',
    ja: '雇用契約書作成',
  },
  'trademark': {
    vi: 'Đăng ký nhãn hiệu',
    en: 'Register Trademark',
    zh: '注册商标',
    ja: ' trademark registration',
  },
  'nda': {
    vi: 'Rà soát hợp đồng / NDA',
    en: 'Review Contract / NDA',
    zh: '审核合同/保密协议',
    ja: '契約/NDAレビュー',
  },
  'other': {
    vi: 'Dịch vụ khác / chưa rõ loại việc',
    en: 'Other / Unclear type',
    zh: '其他/类型不明',
    ja: 'その他/タイプ不明',
  },
};

const LABELS = {
  vi: {
    service: 'Dịch vụ đã chọn',
    workspace: 'Workspace',
    estimate: 'Dự kiến xử lý',
    estimateValue: '2-3 ngày làm việc sau khi đủ tài liệu',
    status: 'Trạng thái',
    statusValue: 'Hồ sơ nháp, chưa gửi cho chuyên viên',
  },
  en: {
    service: 'Selected service',
    workspace: 'Workspace',
    estimate: 'Processing estimate',
    estimateValue: '2-3 business days after docs complete',
    status: 'Status',
    statusValue: 'Draft, not sent to specialist',
  },
  zh: {
    service: '已选服务',
    workspace: '工作区',
    estimate: '预计处理时间',
    estimateValue: '文件齐全后2-3个工作日',
    status: '状态',
    statusValue: '草稿，未发送给专家',
  },
  ja: {
    service: '選択サービス',
    workspace: ' workspace',
    estimate: ' processing estimate',
    estimateValue: '書類齐全後2〜3営業日',
    status: 'ステータス',
    statusValue: '下書き、専門家に未送信',
  },
};

function MiniIcon({ letter }: { letter: string }) {
  return (
    <div className="w-[34px] h-[34px] rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
      {letter}
    </div>
  );
}

export default function SummaryPanel({ selectedService, workspaceName, locale = 'vi' }: SummaryPanelProps) {
  const t = LABELS[locale as keyof typeof LABELS] || LABELS.vi;
  const serviceName = SERVICE_NAMES[selectedService as keyof typeof SERVICE_NAMES]?.[locale as keyof typeof SERVICE_NAMES['agent-contract']] || SERVICE_NAMES[selectedService]?.vi || 'Chưa chọn dịch vụ';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-200">
        <div className="text-teal-700">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Tom tat ho so</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="space-y-4">
          {/* Selected Service */}
          <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">{t.service}</p>
              <p className="text-sm text-slate-600">{serviceName}</p>
            </div>
            <MiniIcon letter="1" />
          </div>

          {/* Workspace */}
          <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">{t.workspace}</p>
              <p className="text-sm text-slate-600">{workspaceName} · an-phat</p>
            </div>
            <MiniIcon letter="W" />
          </div>

          {/* Processing Estimate */}
          <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">{t.estimate}</p>
              <p className="text-sm text-slate-600">{t.estimateValue}</p>
            </div>
            <MiniIcon letter="S" />
          </div>

          {/* Status */}
          <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">{t.status}</p>
              <p className="text-sm text-slate-600">{t.statusValue}</p>
            </div>
            <MiniIcon letter="D" />
          </div>
        </div>
      </div>
    </div>
  );
}
