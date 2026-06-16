import { SignInForm } from "@/components/auth/SignInForm";

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#F0F2F5'
    }}>
      <SignInForm />
    </div>
  );
}
