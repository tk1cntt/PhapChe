import SignInForm from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-[480px] flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(160deg, #0a8f87 0%, #065f5a 60%, #043d3a 100%)',
        }}
      >
        <div>
          {/* Brand mark */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center text-white font-extrabold text-xl backdrop-blur-sm">
              G
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">
              GitNexus Legal
            </span>
          </div>

          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            Nền tảng pháp lý<br />thông minh cho SME
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Gửi yêu cầu pháp lý như nhắn tin.<br />
            Nhận tài liệu đã qua kiểm soát chất lượng.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-4">
          {[
            { icon: '✓', text: 'Quy trình pháp lý có trạng thái & checklist' },
            { icon: '🔒', text: 'Phân quyền theo tenant, audit trail đầy đủ' },
            { icon: '⚡', text: 'Phản hồi nhanh, chất lượng đầu ra nhất quán' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-white/80 text-sm">
              <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">
                {item.icon}
              </span>
              {item.text}
            </div>
          ))}
        </div>

        <p className="text-white/40 text-xs">
          © 2026 GitNexus Legal. All rights reserved.
        </p>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#f8fafc' }}
      >
        <SignInForm />
      </div>
    </div>
  );
}
