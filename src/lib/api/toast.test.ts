import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toastError, toastSuccess, toastInfo } from '../toast';

// Mock react-hot-toast — the default export is a function with .error/.success methods
const mockToast = vi.fn() as any;
mockToast.error = vi.fn();
mockToast.success = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: mockToast,
}));

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
