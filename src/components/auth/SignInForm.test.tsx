import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SignInForm from './SignInForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(),
}));

// Mock auth client (signIn.email only — role is fetched via API)
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('SignInForm', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockSearchParams = {
    get: vi.fn(),
  };

  const mockTranslations = {
    appName: 'GitNexus Legal',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email format',
    passwordRequired: 'Password is required',
    invalidCredentials: 'Invalid credentials',
    loginSuccess: 'Login successful',
    genericError: 'An error occurred',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    (useTranslations as any).mockReturnValue((key: string) => mockTranslations[key as keyof typeof mockTranslations]);
    (useLocale as any).mockReturnValue('vi');
    mockSearchParams.get.mockReturnValue(null);

    // Mock fetch for session-role API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'customer' }),
    });

    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render sign-in form with all required elements', () => {
      render(<SignInForm />);

      expect(screen.getByText('GitNexus Legal')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should not pre-fill demo credentials in test environment', () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });

    it('should pre-fill demo credentials in development environment', () => {
      process.env.NODE_ENV = 'development';
      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

      expect(emailInput.value).toBe('customer.demo@example.test');
      expect(passwordInput.value).toBe('Demo@123456');
    });
  });

  describe('Validation - Whitebox Tests', () => {
    it('should show email required error when email is empty on blur', async () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should show email invalid error for malformed email on blur', async () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('should show password required error when password is empty on blur', async () => {
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText('Password');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should validate all fields on submit when empty', async () => {
      render(<SignInForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should clear email error when valid email is entered', async () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');

      // Trigger error
      fireEvent.blur(emailInput);
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      // Enter valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
        expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow - Blackbox Tests', () => {
    it('should successfully sign in and redirect to role-based path', async () => {
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'customer' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authClient.signIn.email).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Login successful');
        expect(mockRouter.push).toHaveBeenCalledWith('/vi/dashboard');
      });
    });

    it('should show error toast when authentication fails', async () => {
      (authClient.signIn.email as any).mockResolvedValue({
        error: new Error('Invalid credentials')
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    it('should show generic error toast when exception occurs', async () => {
      (authClient.signIn.email as any).mockRejectedValue(new Error('Network error'));

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred');
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    it('should disable form inputs during submission', async () => {
      (authClient.signIn.email as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput.disabled).toBe(true);
        expect(passwordInput.disabled).toBe(true);
        expect(submitButton.disabled).toBe(true);
      });
    });

    it('should fallback to customer role when session-role API fails', async () => {
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/vi/dashboard');
      });
    });

    it('should fetch role from /api/auth/session-role after successful login', async () => {
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'specialist' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/session-role');
      });
    });
  });

  describe('Role-Based Redirects - Blackbox Tests', () => {
    it.each([
      ['customer', '/vi/dashboard'],
      ['specialist', '/vi/specialist'],
      ['reviewer', '/vi/reviewer'],
      ['coordinator_admin', '/vi/admin/dashboard'],
      ['super_admin', '/vi/admin/dashboard'],
      ['audit_admin', '/vi/admin/audit'],
      ['partner', '/vi/partner/dashboard'],
    ])('should redirect %s to %s', async (role, expectedPath) => {
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(expectedPath);
      });
    });

    it('should default to /dashboard for unknown role', async () => {
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'unknown_role' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/vi/dashboard');
      });
    });
  });

  describe('Locale Preservation - Blackbox Tests', () => {
    it.each([
      ['en', '/en/dashboard'],
      ['zh', '/zh/dashboard'],
      ['ja', '/ja/dashboard'],
    ])('should preserve locale %s in redirect', async (locale, expectedPath) => {
      (useLocale as any).mockReturnValue(locale);
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'customer' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(expectedPath);
      });
    });
  });

  describe('Return URL Validation - Abnormal Tests', () => {
    it('should redirect to returnUrl when valid internal path', async () => {
      mockSearchParams.get.mockReturnValue('/profile');
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'customer' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/profile');
      });
    });

    it('should reject external returnUrl and use role-based redirect', async () => {
      mockSearchParams.get.mockReturnValue('https://evil.com');
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'customer' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/vi/dashboard');
        expect(mockRouter.push).not.toHaveBeenCalledWith('https://evil.com');
      });
    });

    it('should reject protocol-relative returnUrl (//evil.com)', async () => {
      mockSearchParams.get.mockReturnValue('//evil.com');
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'customer' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/vi/dashboard');
        expect(mockRouter.push).not.toHaveBeenCalledWith('//evil.com');
      });
    });

    it('should reject returnUrl with protocol in middle', async () => {
      mockSearchParams.get.mockReturnValue('/path?redirect=://evil.com');
      (authClient.signIn.email as any).mockResolvedValue({ error: null });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ role: 'customer' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/vi/dashboard');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria attributes when validation errors occur', async () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText('Email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
        expect(screen.getByText('Email is required')).toHaveAttribute('role', 'alert');
      });
    });

    it('should have accessible labels for all form fields', () => {
      render(<SignInForm />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });
});
