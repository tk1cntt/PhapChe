'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

const DEFAULT_EMAIL = 'customer.demo@example.test';
const DEFAULT_PASSWORD = 'Demo@123456';

// Role-based redirect mapping (moved to module scope — IN-01 fix)
// Keys match DB role values from WorkspaceMembership.role (lowercase)
const ROLE_ROUTES: Record<string, string> = {
  customer: '/dashboard',
  specialist: '/specialist',
  reviewer: '/reviewer',
  coordinator_admin: '/admin/dashboard',
  super_admin: '/admin/dashboard',
  audit_admin: '/admin/audit',
  partner: '/partner/dashboard',
};

export default function SignInForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // Pre-fill demo credentials in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setEmail(DEFAULT_EMAIL);
      setPassword(DEFAULT_PASSWORD);
    }
  }, []);

  // Validation functions
  function validateEmail(value: string): string | undefined {
    if (!value) return t('emailRequired');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t('emailInvalid');
    return undefined;
  }

  function validatePassword(value: string): string | undefined {
    if (!value) return t('passwordRequired');
    return undefined;
  }

  // Open redirect protection (try-catch added — WR-01 fix)
  function isValidReturnUrl(url: string): boolean {
    try {
      const decoded = decodeURIComponent(url);
      if (!decoded.startsWith('/')) return false;
      if (decoded.startsWith('//')) return false;
      if (decoded.includes('://')) return false;
      return true;
    } catch {
      return false;
    }
  }

  function getRedirectPath(userRole: string): string {
    if (returnUrl && isValidReturnUrl(returnUrl)) {
      return returnUrl; // already decoded by searchParams.get() — WR-02 fix
    }
    const rolePath = ROLE_ROUTES[userRole] || '/dashboard';
    return `/${locale}${rolePath}`;
  }

  // Blur handlers
  function handleEmailBlur() {
    setErrors(prev => ({ ...prev, email: validateEmail(email) }));
  }

  function handlePasswordBlur() {
    setErrors(prev => ({ ...prev, password: validatePassword(password) }));
  }

  // Form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(t('invalidCredentials'));
        return;
      }

      toast.success(t('loginSuccess'));

      // Fetch user role from workspace membership API
      let userRole = 'customer';
      try {
        const res = await fetch('/api/auth/session-role');
        if (res.ok) {
          const data = await res.json();
          userRole = data.role || 'customer';
        }
      } catch {
        // Fallback to customer if role fetch fails
      }

      const redirectPath = getRedirectPath(userRole);
      router.push(redirectPath);
    } catch (error) {
      console.error(error);
      toast.error(t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[color:var(--text)]">{t('appName')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-[color:var(--text)]">
            {t('email')}
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder={t('email')}
            disabled={loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-semibold text-[color:var(--text)]">
            {t('password')}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={handlePasswordBlur}
            placeholder={t('password')}
            disabled={loading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={errors.password ? 'border-destructive' : ''}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[color:var(--teal)] text-white font-semibold hover:bg-[color:var(--teal-dark)]"
          disabled={loading}
        >
          {loading ? '⏳ ' : ''}{t('signIn')}
        </Button>
      </form>
    </div>
  );
}
