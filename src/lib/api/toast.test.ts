import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to avoid "Cannot access before initialization" with vi.mock
const { mockToast } = vi.hoisted(() => {
  const toastFn = vi.fn() as any;
  toastFn.error = vi.fn();
  toastFn.success = vi.fn();
  return { mockToast: toastFn };
});

vi.mock('react-hot-toast', () => ({
  default: mockToast,
}));

import { toastError, toastSuccess, toastInfo } from '../toast';

describe('Toast Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('toastError', () => {
    it('should call toast.error with error message', () => {
      toastError('Lỗi máy chủ');
      expect(mockToast.error).toHaveBeenCalledWith('Lỗi máy chủ');
    });

    it('should pass message as-is even if undefined', () => {
      (toastError as any)();
      expect(mockToast.error).toHaveBeenCalledWith(undefined);
    });
  });

  describe('toastSuccess', () => {
    it('should call toast.success with success message', () => {
      toastSuccess('Thao tác thành công');
      expect(mockToast.success).toHaveBeenCalledWith('Thao tác thành công');
    });

    it('should pass message as-is even if undefined', () => {
      (toastSuccess as any)();
      expect(mockToast.success).toHaveBeenCalledWith(undefined);
    });
  });

  describe('toastInfo', () => {
    it('should call toast (default fn) with info message', () => {
      toastInfo('Thông tin quan trọng');
      expect(mockToast).toHaveBeenCalledWith('Thông tin quan trọng');
    });

    it('should pass message as-is even if undefined', () => {
      (toastInfo as any)();
      expect(mockToast).toHaveBeenCalledWith(undefined);
    });
  });
});
