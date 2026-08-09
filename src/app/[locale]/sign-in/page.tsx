import SignInForm from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: `
          radial-gradient(circle at top right, rgba(20,184,166,.12), transparent 35%),
          linear-gradient(180deg, #ffffff, #f8fafc)
        `,
      }}
    >
      <SignInForm />
    </div>
  );
}
