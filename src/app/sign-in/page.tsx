import SignInForm from '@/components/auth/SignInForm';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Right: Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#f8fafc' }}
      >
        <SignInForm />
      </div>
    </div>
  );
}
