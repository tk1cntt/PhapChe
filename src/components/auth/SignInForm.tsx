'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

const DEFAULT_EMAIL = 'customer.demo@example.test';
const DEFAULT_PASSWORD = 'Demo@123456';

// Test users from seed data (for quick selection in dev)
const SEED_USERS = [
  { email: 'superadmin.demo@example.test', password: 'Demo@123456', role: 'super_admin', label: '👑 Super Admin' },
  { email: 'admin.demo@example.test', password: 'Demo@123456', role: 'coordinator_admin', label: '⚙️ Admin' },
  { email: 'reviewer.demo@example.test', password: 'Demo@123456', role: 'reviewer', label: '🔍 Reviewer' },
  { email: 'specialist.demo@example.test', password: 'Demo@123456', role: 'specialist', label: '📋 Specialist' },
  { email: 'customer.demo@example.test', password: 'Demo@123456', role: 'customer', label: '👤 Customer' },
];

const ROLE_ROUTES: Record<string, string> = {
  customer: '/dashboard',
  specialist: '/specialist',
  reviewer: '/reviewer',
  coordinator_admin: '/admin/dashboard',
  super_admin: '/admin/dashboard',
  audit_admin: '/admin/audit',
  partner: '/partner/dashboard',
};

// Translation keys — inline to avoid useTranslations context issues
const T = {
  appName: 'GitNexus Legal',
  email: 'Email',
  password: 'Mật khẩu',
  signIn: 'Đăng nhập',
  rememberMe: 'Ghi nhớ đăng nhập',
  forgotPassword: 'Quên mật khẩu?',
  or: 'hoặc',
  googleSignIn: 'Đăng nhập bằng Google',
  support: 'Cần hỗ trợ?',
  contactAdmin: 'Liên hệ quản trị viên',
  subtitle: 'Đăng nhập để truy cập workspace và quản lý hồ sơ pháp lý của bạn',
  emailRequired: 'Vui lòng nhập email',
  emailInvalid: 'Email không hợp lệ',
  passwordRequired: 'Vui lòng nhập mật khẩu',
  invalidCredentials: 'Email hoặc mật khẩu không đúng',
  loginSuccess: 'Đăng nhập thành công',
  genericError: 'Đã xảy ra lỗi, vui lòng thử lại',
  version: 'GitNexus Legal • Version 1.0.0',
};

// Styles matching layout/login.html exactly
const S = {
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 28,
    padding: 40,
    boxShadow: '0 20px 60px rgba(15,23,42,.08)',
  } as React.CSSProperties,
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
  } as React.CSSProperties,
  logo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    fontWeight: 800,
    boxShadow: '0 12px 32px rgba(15,118,110,.25)',
  } as React.CSSProperties,
  title: {
    textAlign: 'center',
    fontSize: 42,
    fontWeight: 800,
    letterSpacing: -1,
    color: '#0f172a',
    margin: 0,
  } as React.CSSProperties,
  subtitle: {
    textAlign: 'center',
    marginTop: 12,
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: 32,
    fontSize: 15,
  } as React.CSSProperties,
  formGroup: {
    marginBottom: 20,
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#334155',
  } as React.CSSProperties,
  input: (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    height: 52,
    border: `1px solid ${hasError ? '#ef4444' : '#cbd5e1'}`,
    borderRadius: 14,
    padding: '0 16px',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    transition: '0.2s',
    background: '#fff',
    color: '#0f172a',
  }),
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 6,
  } as React.CSSProperties,
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  } as React.CSSProperties,
  remember: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#475569',
    cursor: 'pointer',
  } as React.CSSProperties,
  forgot: {
    textDecoration: 'none',
    color: '#0f766e',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  btn: (loading: boolean): React.CSSProperties => ({
    width: '100%',
    height: 54,
    border: 'none',
    borderRadius: 14,
    cursor: loading ? 'not-allowed' : 'pointer',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'inherit',
    background: loading
      ? '#94a3b8'
      : 'linear-gradient(135deg, #14b8a6, #0f766e)',
    boxShadow: loading ? 'none' : '0 8px 24px rgba(15,118,110,.3)',
    transition: '0.2s',
    opacity: loading ? 0.8 : 1,
  }),
  divider: {
    margin: '28px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    color: '#94a3b8',
    fontSize: 14,
  } as React.CSSProperties,
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#e2e8f0',
  } as React.CSSProperties,
  socialBtn: {
    width: '100%',
    height: 52,
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    fontWeight: 600,
    fontSize: 14,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: '0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: '#334155',
  } as React.CSSProperties,
  support: {
    marginTop: 28,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  } as React.CSSProperties,
  supportLink: {
    color: '#0f766e',
    textDecoration: 'none',
    fontWeight: 600,
  } as React.CSSProperties,
  version: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
  } as React.CSSProperties,
};

export default function SignInForm() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setEmail(DEFAULT_EMAIL);
      setPassword(DEFAULT_PASSWORD);
    }
  }, []);

  // Quick user selection (dev only)
  function selectUser(user: typeof SEED_USERS[0]) {
    setEmail(user.email);
    setPassword(user.password);
    setErrors({});
  }

  function validateEmail(value: string): string | undefined {
    if (!value) return T.emailRequired;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return T.emailInvalid;
    return undefined;
  }

  function validatePassword(value: string): string | undefined {
    if (!value) return T.passwordRequired;
    return undefined;
  }

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
      return returnUrl;
    }
    const rolePath = ROLE_ROUTES[userRole] || '/dashboard';
    return `/${locale}${rolePath}`;
  }

  function handleEmailBlur() {
    setErrors(prev => ({ ...prev, email: validateEmail(email) }));
  }

  function handlePasswordBlur() {
    setErrors(prev => ({ ...prev, password: validatePassword(password) }));
  }

  // Input focus styles applied via className
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (!e.target.classList.contains('input-error')) {
      e.target.style.borderColor = '#14b8a6';
      e.target.style.boxShadow = '0 0 0 4px rgba(20,184,166,.12)';
    }
  }
  function handleBlurFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (!e.target.classList.contains('input-error')) {
      e.target.style.borderColor = '#cbd5e1';
      e.target.style.boxShadow = 'none';
    }
  }

  // Button hover
  function handleBtnEnter(e: React.MouseEvent<HTMLButtonElement>) {
    if (!loading) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 12px 30px rgba(15,118,110,.3)';
    }
  }
  function handleBtnLeave(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = loading ? 'none' : '0 8px 24px rgba(15,118,110,.3)';
  }

  // Social button hover
  function handleSocialEnter(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = '#f8fafc';
  }
  function handleSocialLeave(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = '#fff';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        toast.error(T.invalidCredentials);
        return;
      }
      toast.success(T.loginSuccess);

      let userRole = 'customer';
      try {
        const res = await fetch('/api/auth/session-role');
        if (res.ok) {
          const data = await res.json();
          userRole = data.role || 'customer';
        }
      } catch { /* fallback */ }

      router.push(getRedirectPath(userRole));
    } catch {
      toast.error(T.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.card}>
      {/* Logo */}
      <div style={S.logoWrap}>
        <div style={S.logo}>G</div>
      </div>

      {/* Title */}
      <h1 style={S.title}>{T.appName}</h1>
      <p style={S.subtitle}>{T.subtitle}</p>

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={S.formGroup}>
          <label htmlFor="email" style={S.label}>{T.email}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => { handleEmailBlur(); handleBlurFocus(e); }}
            onFocus={handleFocus}
            placeholder="admin@example.com"
            disabled={loading}
            className={errors.email ? 'input-error' : ''}
            style={S.input(!!errors.email)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" style={S.errorText} role="alert">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div style={S.formGroup}>
          <label htmlFor="password" style={S.label}>{T.password}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={(e) => { handlePasswordBlur(); handleBlurFocus(e); }}
            onFocus={handleFocus}
            placeholder="••••••••••"
            disabled={loading}
            className={errors.password ? 'input-error' : ''}
            style={S.input(!!errors.password)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p id="password-error" style={S.errorText} role="alert">{errors.password}</p>
          )}
        </div>

        {/* Options */}
        <div style={S.options}>
          <label style={S.remember}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ accentColor: '#0f766e' }}
            />
            <span>{T.rememberMe}</span>
          </label>
          <button type="button" style={S.forgot}>{T.forgotPassword}</button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          style={S.btn(loading)}
          disabled={loading}
          onMouseEnter={handleBtnEnter}
          onMouseLeave={handleBtnLeave}
        >
          {loading ? '⏳ ' : ''}{T.signIn}
        </button>
      </form>

      {/* Divider */}
      <div style={S.divider}>
        <div style={S.dividerLine} />
        <span>{T.or}</span>
        <div style={S.dividerLine} />
      </div>

      {/* Google sign-in */}
      <button
        type="button"
        style={S.socialBtn}
        onMouseEnter={handleSocialEnter}
        onMouseLeave={handleSocialLeave}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        {T.googleSignIn}
      </button>

      {/* Support */}
      <p style={S.support}>
        {T.support}{' '}
        <a href="#" style={S.supportLink}>{T.contactAdmin}</a>
      </p>

      {/* Version */}
      <p style={S.version}>{T.version}</p>

      {/* Dev user selector */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: 20, padding: 12, background: '#f0fdfa', borderRadius: 12, border: '1px solid #99f6e4' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#0f766e', marginBottom: 8 }}>
            🧪 Quick Login (Dev)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SEED_USERS.map((user) => (
              <button
                key={user.role}
                type="button"
                onClick={() => selectUser(user)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  background: email === user.email ? '#14b8a6' : '#fff',
                  color: email === user.email ? '#fff' : '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {user.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
