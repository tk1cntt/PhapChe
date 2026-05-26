import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-16 text-[#0F172A] sm:px-6">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6 rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-[14px] font-semibold leading-[1.4] text-[#0F766E]">Legal-as-a-Service</p>
          <h1 className="text-[28px] font-semibold leading-[1.2]">Nền tảng quản trị pháp lý</h1>
          <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
            Truy cập khu vực admin để quản lý người dùng, workspace, hồ sơ yêu cầu và audit.
          </p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex h-10 w-fit items-center rounded-md bg-[#0F766E] px-4 text-[14px] font-semibold leading-[1.4] text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
        >
          Vào quản trị người dùng
        </Link>
      </div>
    </main>
  );
}
